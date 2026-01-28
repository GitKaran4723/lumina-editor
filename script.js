// Initialize Icons
const refreshIcons = () => window.lucide && window.lucide.createIcons();
refreshIcons();

// Markdown-it Init (Standard configuration to align with target)
const md = window.markdownit({
    html: true,
    linkify: true,
    typography: true,
    breaks: true
});

const editor = document.getElementById('markdown-input');
const preview = document.getElementById('preview-output');
const container = document.getElementById('main-container');

// Standard Content matching the user's focus
const introText = `# Notes Editor

This editor is aligned with your notes rendering system.

## 📐 LateX Math (MathJax)
Inline: $E = mc^2$

Block:
$$
\\oint_C \\mathbf{B} \\cdot d\\mathbf{l} = \\mu_0 I_{\\text{enc}}
$$

## ✨ Features
- **Themes**: Light, Sepia, Dark, Ocean, Forest.
- **Views**: Full Editor, Split, Full Preview.
- **Mirroring**: Styled exactly like the target concept reader.
`;

editor.value = introText;

// Live Preview Logic
function updatePreview() {
    const text = editor.value;
    preview.innerHTML = md.render(text);

    // Trigger MathJax typeset
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([preview]).catch(err => console.error(err));
    }

    // Stats
    document.getElementById('char-count').textContent = `${text.length} characters`;
    document.getElementById('word-count').textContent = `${text.trim() ? text.trim().split(/\s+/).length : 0} words`;

    // Auto-save
    localStorage.setItem('lumina_notes_cache', text);
}

// Toolbar Actions
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const val = editor.value;
        const selected = val.substring(start, end);
        let wrap = '';

        switch (tool) {
            case 'bold': wrap = `**${selected || 'text'}**`; break;
            case 'italic': wrap = `*${selected || 'text'}*`; break;
            case 'heading': wrap = `\n## ${selected || 'Heading'}`; break;
            case 'list': wrap = `\n- ${selected || 'item'}`; break;
            case 'quote': wrap = `\n> ${selected || 'quote'}`; break;
            case 'link': wrap = `[${selected || 'text'}](url)`; break;
            case 'image': wrap = `![${selected || 'alt'}](url)`; break;
            case 'table': wrap = `\n| Col | Col |\n|---|---|\n| val | val |`; break;
        }

        editor.value = val.substring(0, start) + wrap + val.substring(end);
        updatePreview();
        editor.focus();
    });
});

// View Modes
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        container.classList.remove('split-view', 'edit-mode', 'preview-mode');
        if (view === 'split') container.classList.add('split-view');
        else if (view === 'edit') container.classList.add('edit-mode');
        else if (view === 'preview') container.classList.add('preview-mode');
    });
});

// Theme Selector
document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const theme = dot.dataset.theme;
        document.body.className = `theme-${theme}`;
        document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        localStorage.setItem('lumina_theme_pref', theme);
    });
});

// Resizer logic
let isResizing = false;
document.getElementById('resizer').addEventListener('mousedown', () => isResizing = true);
document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const percentage = (e.clientX / window.innerWidth) * 100;
    if (percentage > 20 && percentage < 80) {
        document.querySelector('.editor-pane').style.flex = `0 0 ${percentage}%`;
    }
});
document.addEventListener('mouseup', () => isResizing = false);

// Init
editor.addEventListener('input', updatePreview);
document.addEventListener('DOMContentLoaded', () => {
    const savedText = localStorage.getItem('lumina_notes_cache');
    if (savedText) editor.value = savedText;

    const savedTheme = localStorage.getItem('lumina_theme_pref') || 'light';
    document.body.className = `theme-${savedTheme}`;
    document.querySelector(`.theme-dot[data-theme="${savedTheme}"]`).classList.add('active');

    updatePreview();
    refreshIcons();
});
