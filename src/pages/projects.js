const sels = ['input[type=color]', 'input[type=text]', '.text-small', '.project-title', 'button.display-during-select', 'button.display-during-delete'];

export default function () {
    document.querySelectorAll('.Box-row').forEach(row => {
        let [color, titleinput, description, title, selectBtn, deleteBtn] = sels.map(s => row.querySelector(s));
        color.addEventListener('input', () => {
            description.style['border-color'] = color.value;
        });
        titleinput.addEventListener('input', () => {
            title.innerText = titleinput.value;
        });
        selectBtn.addEventListener('click', () => {
            selectBtn.innerText = selectBtn.innerText == 'Select' ? 'Combine' : 'Select';
            selectBtn.classList.toggle('btn-blue');
        });
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete ${title.innerText}?`)) {
                row.classList.add('d-none');
            }
        });
    });
}