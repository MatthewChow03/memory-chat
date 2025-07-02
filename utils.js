// Get the current prompt text from the input area
function getPromptText() {
  const prompt = document.querySelector('.ProseMirror');
  return prompt ? prompt.innerText.trim() : '';
} 