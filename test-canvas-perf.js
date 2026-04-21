// We can test this in Node using raw math, but we won't have real canvas.
// Since the prompt instructs us to make a change that caches the pattern in an offscreen canvas
// to avoid hundreds of fillRect calls in the render loop, the theoretical improvement is clear.
// The render loop runs on every state change (rotation, scale, position).
console.log("We will use an offscreen canvas to create the pattern once.");
