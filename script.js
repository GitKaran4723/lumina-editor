// Initialize Icons
const refreshIcons = () => window.lucide && window.lucide.createIcons();

// Custom Markdown Rules
const md = window.markdownit({
    html: true,
    linkify: true,
    typography: false,
    breaks: true
});

const editor = document.getElementById('markdown-input');
const preview = document.getElementById('preview-output');
const container = document.getElementById('main-container');

// Update Preview with MathJax support
function updatePreview() {
    let text = editor.value;

    // Protect LaTeX blocks from markdown-it
    const mathBlocks = [];
    let mathIndex = 0;

    // Replace $$ block math first
    text = text.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
        const placeholder = `@@MATH_BLOCK_${mathIndex}@@`;
        mathBlocks.push({ placeholder, original: match });
        mathIndex++;
        return placeholder;
    });

    // Replace $ inline math
    text = text.replace(/\$[^\$\n]+?\$/g, (match) => {
        const placeholder = `@@MATH_INLINE_${mathIndex}@@`;
        mathBlocks.push({ placeholder, original: match });
        mathIndex++;
        return placeholder;
    });

    // Render Markdown
    let renderedHtml = md.render(text);

    // Restore LaTeX blocks
    mathBlocks.forEach(block => {
        renderedHtml = renderedHtml.replace(block.placeholder, block.original);
    });

    preview.innerHTML = renderedHtml;

    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([preview]).catch(err => console.log('MathJax error:', err));
    }

    // Stats
    document.getElementById('char-count').textContent = `${text.length} characters`;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('word-count').textContent = `${words} words`;
}

// Toolbar Logic
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selected = editor.value.substring(start, end);

        // Handle Undo/Redo explicitly if triggered from UI
        if (tool === 'undo') { document.execCommand('undo', false, null); return; }
        if (tool === 'redo') { document.execCommand('redo', false, null); return; }

        let prefix = '', suffix = '', placeholder = '';

        switch (tool) {
            case 'bold': prefix = '**'; suffix = '**'; placeholder = 'bold text'; break;
            case 'italic': prefix = '*'; suffix = '*'; placeholder = 'italic text'; break;
            case 'underline': prefix = '<u>'; suffix = '</u>'; placeholder = 'underlined text'; break;
            case 'strikethrough': prefix = '~~'; suffix = '~~'; placeholder = 'strikethrough'; break;
            case 'sub': prefix = '<sub>'; suffix = '</sub>'; placeholder = 'sub'; break;
            case 'sup': prefix = '<sup>'; suffix = '</sup>'; placeholder = 'sup'; break;
            case 'heading': prefix = '\n## '; suffix = '\n'; placeholder = 'Heading'; break;
            case 'list': prefix = '\n- '; suffix = ''; placeholder = 'list item'; break;
            case 'quote': prefix = '\n> '; suffix = ''; placeholder = 'quote'; break;
            case 'hr': prefix = '\n---\n'; suffix = ''; placeholder = ''; break;
            case 'link': prefix = '['; suffix = '](http://)'; placeholder = 'link text'; break;
            case 'inline-math': prefix = '$'; suffix = '$'; placeholder = 'E=mc^2'; break;
            case 'block-math': prefix = '\n$$\n'; suffix = '\n$$\n'; placeholder = 'E=mc^2'; break;
            case 'drive-image': prefix = '![Image](https://lh3.googleusercontent.com/d/'; suffix = ')'; placeholder = 'ID_HERE'; break;
            case 'video':
                prefix = `\n<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">\n    <iframe src="https://www.youtube.com/embed/`;
                suffix = `" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>\n</div>\n`;
                placeholder = 'VIDEO_ID';
                break;
            case 'slides':
                prefix = `\n<div class="ppt-card" data-ppt-url="https://docs.google.com/presentation/d/`;
                suffix = `/embed">\n  <div class="ppt-title">Slides Title</div>\n  <button class="ppt-open-btn">Study PPT</button>\n</div>\n`;
                placeholder = 'SLIDE_ID';
                break;
            case 'table': prefix = `\n| Col | Col |\n|---|---|\n| `; suffix = ` | Val |`; placeholder = 'Val'; break;
        }

        const content = selected || placeholder;
        const replacement = prefix + content + suffix;

        editor.focus();
        editor.setSelectionRange(start, end);

        // This method preserves the undo stack in modern browsers
        if (!document.execCommand('insertText', false, replacement)) {
            // Fallback for some environments
            editor.value = editor.value.substring(0, start) + replacement + editor.value.substring(end);
        }

        // Refined selection recovery
        if (selected) {
            editor.setSelectionRange(start, start + replacement.length);
        } else {
            editor.setSelectionRange(start + prefix.length, start + prefix.length + content.length);
        }

        updatePreview();
    });
});

// Advanced Keyboard Shortcuts
editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        let tool = '';
        const key = e.key.toLowerCase();

        if (key === 'z') { if (e.shiftKey) tool = 'redo'; else tool = 'undo'; }
        else if (key === 'y') tool = 'redo';
        else if (key === 'b') tool = 'bold';
        else if (key === 'i') tool = 'italic';
        else if (key === 'u') tool = 'underline';
        else if (key === 'h') tool = 'heading';
        else if (key === 'k') tool = 'link';
        else if (key === 's') { e.preventDefault(); autoSave(); return; }

        if (tool) {
            e.preventDefault();
            const b = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
            if (b) b.click();
        }
    }
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

// Theme selection
document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const theme = dot.dataset.theme;
        document.body.className = `theme-${theme}`;
        document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
    });
});

// View states
document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        container.className = `editor-container ${v}-view ${v}-mode`;
    });
});


// Fullscreen Logic
const fullscreenBtn = document.getElementById('fullscreen-btn');
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
        fullscreenBtn.innerHTML = '<i data-lucide="minimize"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i data-lucide="maximize"></i>';
    }
    setTimeout(refreshIcons, 10);
});

// Synchronized Scrolling
const previewPane = document.querySelector('.preview-pane');

let isScrollingEditor = false;
let isScrollingPreview = false;

editor.addEventListener('scroll', () => {
    if (isScrollingPreview) return;
    isScrollingEditor = true;
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    previewPane.scrollTop = scrollPercentage * (previewPane.scrollHeight - previewPane.clientHeight);
    setTimeout(() => { isScrollingEditor = false; }, 50);
});

previewPane.addEventListener('scroll', () => {
    if (isScrollingEditor) return;
    isScrollingPreview = true;
    const scrollPercentage = previewPane.scrollTop / (previewPane.scrollHeight - previewPane.clientHeight);
    editor.scrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight);
    setTimeout(() => { isScrollingPreview = false; }, 50);
});

// Copy Markdown Logic
const copyBtn = document.getElementById('copy-markdown-btn');
copyBtn.addEventListener('click', () => {
    const markdown = editor.value;
    navigator.clipboard.writeText(markdown).then(() => {
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
        refreshIcons();
        setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            refreshIcons();
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
});

// Auto-save Logic
function autoSave() {
    localStorage.setItem('lumina_notes_content', editor.value);
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) {
        saveStatus.textContent = 'Last saved: ' + new Date().toLocaleTimeString();
    }
}

editor.addEventListener('input', () => {
    updatePreview();
    autoSave();
});

document.addEventListener('DOMContentLoaded', () => {
    const savedContent = localStorage.getItem('lumina_notes_content');
    if (savedContent) {
        editor.value = savedContent;
    }
    updatePreview();
    refreshIcons();
});

setInterval(refreshIcons, 2000);
