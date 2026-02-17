function showAddModal() {
    document.getElementById('addActionModal').classList.add('active');
}
function hideAddModal() {
    document.getElementById('addActionModal').classList.remove('active');
    document.getElementById('addActionForm').reset();
    document.getElementById('photoBeforePreview').innerHTML = '';
    document.getElementById('locationInfo').textContent = '';
}
function showCompleteModal(id) {
    window._currentActionId = id;
    document.getElementById('completeActionModal').classList.add('active');
}
function hideCompleteModal() {
    document.getElementById('completeActionModal').classList.remove('active');
    document.getElementById('completeActionForm').reset();
    document.getElementById('photoAfterPreview').innerHTML = '';
    window._currentActionId = null;
}
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) el.classList.remove('active');
    });
});