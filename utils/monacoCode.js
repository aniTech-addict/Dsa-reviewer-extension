/**
 * Executes the script in the Main world, allowing access to the variables of the senderTab.id
 * get reference to monaco editor and retrieves code from editor.
 * @returns {Object}: { ok: boolean, code: string }
 */
export function getUserCode() {
  const monacoRef = globalThis.monaco;
  if (!monacoRef?.editor?.getEditors) {
    return { ok: false, error: 'Monaco is not available on this page yet' };
  }

  const editors = monacoRef.editor.getEditors();
  if (!editors || editors.length === 0) {
    return { ok: false, error: 'No Monaco editor instances found' };
  }

  return { ok: true, code: editors[0].getValue() };
}
