import React, { useEffect, useState } from 'react';
import { FiSend, FiMoreVertical } from 'react-icons/fi';
import { io } from "socket.io-client";

const socket = io("https://mariage-hall-booking-system.vercel.app", {
  transports: ["websocket"],
});



const Message = () => {
  const [chats, setChats] = useState(() => {
    const savedManagerId = sessionStorage.getItem("chatWith");
    if (savedManagerId) {
      return [{
        id: savedManagerId,
        name: 'Manager',
        lastMessage: 'Start chatting...',
        time: 'Now',
        unread: 0,
        avatar: 'https://ui-avatars.com/api/?name=Manager&background=0D8ABC&color=fff'
      }];
    }
    return [];
  });

  const [activeChat, setActiveChat] = useState(() => sessionStorage.getItem("chatWith") || null);
  const [messageInput, setMessageInput] = useState('');

  // State for messages (Map of chatID -> array of messages)
  const [conversations, setConversations] = useState({});

  const userid = sessionStorage.getItem("user")

  const user = userid ? JSON.parse(userid)._id : null;

  const managerid = sessionStorage.getItem("chatWith");

  const [useridget, setUseridget] = useState({});
  console.log("purpose to get the user id ", useridget)


  const gettheuserid = useridget.fromUserId;
  console.log(conversations)

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    let targetId = activeChat;

    // Optimistic Update
    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage]
    }));

    // Update last message in chat list
    setChats(prev => prev.map(chat =>
      chat.id === activeChat
        ? { ...chat, lastMessage: messageInput, time: 'Just now' }
        : chat
    ));

    socket.emit("send-message", {
      fromUserId: user,
      toUserId: targetId,
      message: messageInput
    });

    setMessageInput('');
  };
  // console.log(messages)

  // useEffect(() => {
  //   if (user) {
  //     socket.emit("join", user);
  //   }

  //   const handleReceiveMessage = (data) => {
  //     console.log("Received message:", data);
  //     const newMessage = {
  //       id: Date.now(), // Generate a temp ID
  //       sender: data.fromUserId === user ? 'me' : 'them',
  //       text: data.message,
  //       time: data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //     };
  //     setMessages((prev) => [...prev, newMessage]);
  //   };

  //   socket.on("receive-message", handleReceiveMessage);

  //   return () => {
  //     socket.off("receive-message", handleReceiveMessage);
  //   };
  // }, [user]);
  // useEffect(() => {
  // console.log("useEffect")
  //   socket.on("receive-message", (data)=>{
  //     console.log(data)
  //     setMessages((prev)=>[...prev,data])
  //   })


  // }, []);


  // Fetch user details helper
  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`https://mariage-hall-booking-system.vercel.app/api/user/${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
    return null;
  };

  // Update manager name if managerid exists
  useEffect(() => {
    if (managerid) {
      fetchUserDetails(managerid).then(data => {
        if (data && data.name) {
          setChats(prev => prev.map(c =>
            c.id === managerid ? { ...c, name: data.name } : c
          ));
        }
      });
    }
  }, [managerid]);

  // Fetch all conversations for the user
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const response = await fetch(`https://mariage-hall-booking-system.vercel.app/api/chat/conversations/${user}`);
        if (response.ok) {
          const data = await response.json();
          setChats(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newConversations = data.filter(c => !existingIds.has(c.id));
            return [...prev, ...newConversations];
          });
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchConversations();
  }, [user]);

  // Fetch chat history
  useEffect(() => {
    if (!user || !activeChat) return;

    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`https://mariage-hall-booking-system.vercel.app/api/chat/messages/${user}/${activeChat}`);
        if (response.ok) {
          const dbMessages = await response.json();
          const mappedMessages = dbMessages.map(msg => ({
            id: msg._id,
            sender: msg.fromUserId === user ? 'me' : 'them',
            text: msg.message,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          setConversations(prev => ({
            ...prev,
            [activeChat]: mappedMessages
          }));
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchChatHistory();
  }, [user, activeChat]);

  useEffect(() => {
    if (!user) return;

    console.log("Joining room:", user);
    socket.emit("join", user);

    const handleReceiveMessage = async (data) => {
      console.log("Received:", data);
      const isFromMe = data.fromUserId === user;
      if (isFromMe) return;

      const partnerId = data.fromUserId;
      const newMessage = {
        id: Date.now(),
        sender: "them",
        text: data.message,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      // 1. Update Conversations State
      setConversations(prev => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] || []), newMessage]
      }));

      // 2. Update Chats List
      setChats(prevChats => {
        const existingIdx = prevChats.findIndex(c => c.id === partnerId);
        if (existingIdx !== -1) {
          const updated = [...prevChats];
          updated[existingIdx] = {
            ...updated[existingIdx],
            lastMessage: data.message,
            time: newMessage.time,
            unread: activeChat === partnerId ? 0 : (updated[existingIdx].unread || 0) + 1
          };
          return updated;
        } else {
          // If the user is new, we trigger the fetch logic
          // But we return prevChats for now to avoid crashing
          fetchUserDetails(partnerId).then(userData => {
            const name = userData ? userData.name : `User ${partnerId.substr(0, 5)}...`;
            const newChat = {
              id: partnerId,
              name: name,
              lastMessage: data.message,
              time: newMessage.time,
              unread: activeChat === partnerId ? 0 : 1,
              avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
            };
            setChats(p => p.some(c => c.id === partnerId) ? p : [newChat, ...p]);
          });
          return prevChats;
        }
      });
    };

    socket.on("receive-message", handleReceiveMessage);
    return () => socket.off("receive-message", handleReceiveMessage);
  }, [user, activeChat]);

  // Derived state for current chat view
  const currentChat = chats.find(c => c.id === activeChat);
  const currentMessages = conversations[activeChat] || [];


  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 font-poppins overflow-hidden">
      {/* LEFT SIDEBAR - 20% */}
      <div className="w-1/5 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10">

        {/* Header - Simplified */}
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>

        {/* Search Bar Removed as requested to simplify */}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${activeChat === chat.id ? 'border-gold bg-amber-50/30' : 'border-transparent'}`}
            >
              <div className="relative">
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                {chat.unread > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
              </div>
              <div className="ml-3 overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <h4 className={`text-sm font-semibold truncate ${activeChat === chat.id ? 'text-gray-900' : 'text-gray-700'}`}>{chat.name}</h4>
                  <span className="text-xs text-gray-400 ml-2">{chat.time}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${activeChat === chat.id ? 'text-gold' : 'text-gray-500'}`}>{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN AREA - 80% */}
      <div className="w-4/5 flex flex-col bg-white bg-opacity-50 backdrop-blur-sm">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="h-20 bg-white/80 border-b border-gray-100 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center">
                <div className="relative">
                  <img src={currentChat.avatar} alt="" className="w-10 h-10 rounded-full shadow-md border-2 border-white" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-800">{currentChat.name}</h3>
                  <p className="text-xs text-green-500 font-medium flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span> Online
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-gray-400">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><FiMoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[70%] ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.sender === 'them' && (
                      <img src={currentChat.avatar} alt="" className="w-8 h-8 rounded-full mb-1 self-end shadow-sm" />
                    )}

                    <div className={`mx-2 p-4 shadow-sm relative group ${msg.sender === 'me'
                      ? 'bg-gradient-to-r from-gold to-gold-dark text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                      }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className={`text-[10px] absolute bottom-1 ${msg.sender === 'me' ? 'left-2 text-white/70' : 'right-2 text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-gold/20 focus-within:border-gold/30 transition-all shadow-sm">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-gray-700 placeholder-gray-400 text-sm"
                  style={{ boxShadow: 'none' }}
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className={`p-2.5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${messageInput.trim()
                    ? 'bg-gradient-to-r from-gold to-gold-dark text-white hover:shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <FiSend size={16} className={messageInput.trim() ? 'ml-0.5' : ''} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p className="text-lg font-medium text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Message