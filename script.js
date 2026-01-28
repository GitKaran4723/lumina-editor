// Initialize Icons
const refreshIcons = () => window.lucide && window.lucide.createIcons();

// Custom Markdown Rules
const md = window.markdownit({
    html: true,
    linkify: true,
    typography: true,
    breaks: true
});

const editor = document.getElementById('markdown-input');
const preview = document.getElementById('preview-output');
const container = document.getElementById('main-container');

// Update Preview with MathJax support
function updatePreview() {
    const text = editor.value;
    preview.innerHTML = md.render(text);

    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([preview]);
    }

    // Stats
    document.getElementById('char-count').textContent = `${text.length} characters`;
    document.getElementById('word-count').textContent = `${text.trim() ? text.trim().split(/\s+/).length : 0} words`;
}

// Toolbar Logic
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const val = editor.value;
        const selected = val.substring(start, end);
        let wrap = '';

        switch (tool) {
            case 'bold': wrap = `**${selected || 'bold'}**`; break;
            case 'italic': wrap = `*${selected || 'italic'}*`; break;
            case 'underline': wrap = `<u>${selected || 'underline'}</u>`; break;
            case 'strikethrough': wrap = `~~${selected || 'strike'}~~`; break;
            case 'sub': wrap = `~${selected || 'sub'}~`; break;
            case 'sup': wrap = `^${selected || 'sup'}^`; break;
            case 'heading': wrap = `\n## ${selected || 'Heading'}\n`; break;
            case 'list': wrap = `\n- ${selected || 'item'}`; break;
            case 'quote': wrap = `\n> ${selected || 'quote'}`; break;
            case 'hr': wrap = `\n---\n`; break;
            case 'link': wrap = `[${selected || 'text'}](http://)`; break;
            case 'inline-math': wrap = `$${selected || 'E=mc^2'}$`; break;
            case 'block-math': wrap = `\n$$\n${selected || 'E=mc^2'}\n$$\n`; break;
            case 'drive-image': wrap = `![Image](https://lh3.googleusercontent.com/d/ID_HERE)`; break;
            case 'video':
                wrap = `\n<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">\n    <iframe src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>\n</div>\n`;
                break;
            case 'slides':
                wrap = `\n<div class="ppt-card" data-ppt-url="https://docs.google.com/presentation/d/SLIDE_ID/embed">\n  <div class="ppt-title">Slides Title</div>\n  <button class="ppt-open-btn">Study PPT</button>\n</div>\n`;
                break;
            case 'table': wrap = `\n| Col | Col |\n|---|---|\n| Val | Val |`; break;
        }

        editor.value = val.substring(0, start) + wrap + val.substring(end);
        updatePreview();
        editor.focus();
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

// Logic for custom subscript/superscript in markdown-it
md.inline.ruler.after('emphasis', 'subscript', (state, silent) => {
    if (state.src.charAt(state.pos) !== '~') return false;
    let end = state.src.indexOf('~', state.pos + 1);
    if (end < 0) return false;
    if (!silent) {
        let token = state.push('sub_open', 'sub', 1);
        token.markup = '~';
        state.pos++;
        state.md.inline.parse(state.src.slice(state.pos, end), state.md, state.env, state.tokens);
        state.pos = end + 1;
        state.push('sub_close', 'sub', -1);
    } else {
        state.pos = end + 1;
    }
    return true;
});

md.inline.ruler.after('emphasis', 'superscript', (state, silent) => {
    if (state.src.charAt(state.pos) !== '^') return false;
    let end = state.src.indexOf('^', state.pos + 1);
    if (end < 0) return false;
    if (!silent) {
        let token = state.push('sup_open', 'sup', 1);
        token.markup = '^';
        state.pos++;
        state.md.inline.parse(state.src.slice(state.pos, end), state.md, state.env, state.tokens);
        state.pos = end + 1;
        state.push('sup_close', 'sup', -1);
    } else {
        state.pos = end + 1;
    }
    return true;
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

editor.addEventListener('input', updatePreview);
document.addEventListener('DOMContentLoaded', () => {
    updatePreview();
    refreshIcons();
});
setInterval(refreshIcons, 2000);
