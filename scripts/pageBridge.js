window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "ai-analyzer-content") return;
  if (event.data?.type !== "GET_CODE") return;

  const requestId = event.data?.requestId;

  try {
    const editors = window.monaco?.editor?.getEditors?.();
    if (!editors || editors.length === 0) {
      window.postMessage({
        source: "ai-analyzer-bridge",
        requestId,
        error: "No editor instance found"
      }, "*");
      return;
    }

    const code = editors[0].getValue();
    window.postMessage({
      source: "ai-analyzer-bridge",
      requestId,
      code
    }, "*");
  } catch (error) {
    window.postMessage({
      source: "ai-analyzer-bridge",
      requestId,
      error: error?.message || "Unknown error"
    }, "*");
  }
});
