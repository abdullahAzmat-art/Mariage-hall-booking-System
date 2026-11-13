// Request validation middleware. Zod schemas validate structure, types and
// formats only; business rules stay in services such as bookingRules.js.
const formatIssuePath = (path = []) =>
  path.reduce((result, part) => {
    if (typeof part === 'number') return `${result}[${part}]`;
    return result ? `${result}.${part}` : String(part);
  }, '');

const validate = (schemas = {}) => (req, res, next) => {
  const errors = [];

  for (const source of ['params', 'query', 'body']) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = formatIssuePath(issue.path);
        errors.push({
          field: path ? `${source}.${path}` : source,
          message: issue.message,
        });
      }
      continue;
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'params') {
      Object.assign(req.params, result.data);
    } else {
      Object.assign(req.query, result.data);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  return next();
};

module.exports = { validate };
