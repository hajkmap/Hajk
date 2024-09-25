export default function errorHandler(err, req, res) {
  const errors = err.errors || [{ message: err.message }];
  res.status(err.status || 500).json({ errors });
}
