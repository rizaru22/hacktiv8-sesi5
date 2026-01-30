const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });
  input.value = '';

  const thinkingId = appendMessage('bot', 'Gemini is thinking...');

  try {
   const url = `http://localhost:3001/api/chat`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });

    // If server returned non-2xx, show status with body text
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      removeMessage(thinkingId);
      appendMessage('bot', `Server error: ${resp.status} ${resp.statusText} ${text}`);
      console.error('Fetch error', resp.status, resp.statusText, text);
      return;
    }

    const data = await resp.json().catch(async () => {
      const t = await resp.text().catch(() => '');
      return { result: t };
    });

    // remove thinking message and show real reply
    removeMessage(thinkingId);

    const botText = data?.result || 'No reply from server.';
    appendMessage('bot', botText);
    conversation.push({ role: 'user', text: botText });
  } catch (err) {
    removeMessage(thinkingId);
    appendMessage('bot', `Error: could not reach server. ${err.message || err}`);
    console.error(err);
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg.dataset.messageId = Math.random().toString(36).slice(2);
}

function removeMessage(id) {
  const children = Array.from(chatBox.children);
  for (const child of children) {
    if (child.dataset.messageId === id) {
      chatBox.removeChild(child);
      return true;
    }
  }
  return false;
}
