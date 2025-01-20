export const generateNames = () => {
  const adjectives = [
    "Buggy",
    "Snappy",
    "Binary",
    "Async",
    "Dynamic",
    "Hacky",
    "Recursive",
    "Faulty",
    "Refactored",
    "Lazy",
  ];
  const nouns = [
    "Compiler",
    "Debugger",
    "Function",
    "Closure",
    "Variable",
    "Exception",
    "Promise",
    "Algorithm",
    "Object",
    "Framework",
  ];

  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`;
};
