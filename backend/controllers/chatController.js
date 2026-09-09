const Message = require('../models/messageModel');
const User = require('../models/userModel');

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    // Dynamically import the ES module graph
    const { venuoraGraph } = await import('../Venuora-AI/graph/venuoraGraph.js');

    const initialState = { question: message };
    const finalState = await venuoraGraph.invoke(initialState);

    // finalState.answer holds the string response (or stringified JSON for halls)
    res.json({ reply: finalState.answer });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
  }
};

// ── Streaming SSE endpoint ────────────────────────────────────────
const chatStreamWithAI = async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { message, threadId } = req.body;
    const { venuoraGraph } = await import('../Venuora-AI/graph/venuoraGraph.js');
    const { Command }      = await import('@langchain/langgraph');

    // Each conversation gets a persistent thread so MemorySaver can resume interrupts
    const activeThreadId = threadId || crypto.randomUUID();
    const config = { configurable: { thread_id: activeThreadId } };

    // Tell the frontend which threadId to use for follow-up messages
    send('thread', { threadId: activeThreadId });

    // ── Detect if this thread is paused at an interrupt ──────
    const currentState = await venuoraGraph.getState(config);
    const isInterrupted = Array.isArray(currentState?.next) && currentState.next.length > 0;

    // Choose: resume a paused graph OR start fresh
    const streamInput = isInterrupted
      ? new Command({ resume: message })
      : { question: message };

    const stream = await venuoraGraph.stream(streamInput, {
      ...config,
      streamMode: "updates", // yields per-node state patches
    });

    let finalAnswer = null;
    let hallsPayload = null;
    let interrupted  = false;

    for await (const chunk of stream) {

      // ── Interrupt fired (booking_prompt paused) ──────────
      if (chunk.__interrupt__) {
        const interruptMsg = chunk.__interrupt__[0]?.value ?? "Would you like to proceed?";
        interrupted = true;

        // If we found halls before the interrupt, send them now!
        if (hallsPayload) {
          send('halls', hallsPayload);
          // Also optionally send the text from view_halls if it differs
          if (finalAnswer && finalAnswer !== JSON.stringify(hallsPayload)) {
            const CHUNK_SIZE = 3;
            const DELAY_MS   = 18;
            for (let i = 0; i < finalAnswer.length; i += CHUNK_SIZE) {
              send('token', { text: finalAnswer.slice(i, i + CHUNK_SIZE) });
              await new Promise((r) => setTimeout(r, DELAY_MS));
            }
          }
        }

        // Stream the interrupt question char by char
        const CHUNK_SIZE = 3;
        const DELAY_MS   = 18;
        for (let i = 0; i < interruptMsg.length; i += CHUNK_SIZE) {
          send('token', { text: interruptMsg.slice(i, i + CHUNK_SIZE) });
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }

        send('done', { threadId: activeThreadId, awaitingReply: true });
        return res.end();
      }

      // ── Collect the latest answer from whichever node ran ─
      const nodeOutput = Object.values(chunk)[0];
      if (nodeOutput?.answer !== undefined) {
        finalAnswer = nodeOutput.answer;
      }
      if (nodeOutput?.viewHallsOutput !== undefined) {
        hallsPayload = nodeOutput.viewHallsOutput;
      }
    }

    if (!finalAnswer && !hallsPayload) {
      send('done', { threadId: activeThreadId });
      return res.end();
    }

    if (hallsPayload) {
      // Send the halls payload as an SSE event
      send('halls', hallsPayload);
      
      // We can also send the text answer if there is one
      if (finalAnswer && finalAnswer !== JSON.stringify(hallsPayload)) {
        const CHUNK_SIZE = 3;
        const DELAY_MS   = 18;
        for (let i = 0; i < finalAnswer.length; i += CHUNK_SIZE) {
          send('token', { text: finalAnswer.slice(i, i + CHUNK_SIZE) });
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
      }
    } else if (finalAnswer) {
      // Stream plain text char by char
      const CHUNK_SIZE = 3;
      const DELAY_MS   = 18;
      for (let i = 0; i < finalAnswer.length; i += CHUNK_SIZE) {
        send('token', { text: finalAnswer.slice(i, i + CHUNK_SIZE) });
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    send('done', { threadId: activeThreadId, awaitingReply: false });
    res.end();

  } catch (error) {
    console.error("Stream Chat Error:", error);
    send('error', { message: "Sorry, something went wrong. Please try again." });
    res.end();
  }
};


const getMessages = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all messages involving the user
    const messages = await Message.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    }).sort({ timestamp: -1 });

    const conversationsMap = new Map();

    for (const msg of messages) {
      const partnerId = msg.fromUserId.toString() === userId ? msg.toUserId.toString() : msg.fromUserId.toString();

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          lastMessage: msg.message,
          time: msg.timestamp,
        });
      }
    }

    const conversations = [];
    for (const [partnerId, data] of conversationsMap.entries()) {
      const partner = await User.findById(partnerId).select('name role');
      if (partner) {
        conversations.push({
          id: partnerId,
          name: partner.name,
          lastMessage: data.lastMessage,
          time: new Date(data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: `https://ui-avatars.com/api/?name=${partner.name}&background=random`
        });
      }
    }

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Error fetching conversations" });
  }
};

module.exports = { chatWithAI, chatStreamWithAI, getMessages, getConversations };
