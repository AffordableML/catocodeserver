document.addEventListener('DOMContentLoaded', () => {
    // --- Public Project Page Logic ---
    const likeBtn = document.getElementById('like-btn');
    const remixBtn = document.getElementById('remix-btn');

    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            const projectUid = likeBtn.dataset.uid;
            try {
                const response = await fetch(`/project/${projectUid}/like`, { method: 'POST' });
                if (response.status === 401) {
                    alert('Please log in to like a project.');
                    return;
                }
                const data = await response.json();
                if (data.success) {
                    document.getElementById('like-count').textContent = data.new_count;
                    likeBtn.classList.toggle('liked', data.liked); // Add a visual class if you want
                }
            } catch (error) {
                console.error('Error liking project:', error);
            }
        });
    }

    if (remixBtn) {
        remixBtn.addEventListener('click', async () => {
            if (!confirm('This will create a copy of the project in your dashboard. Continue?')) return;
            const projectUid = remixBtn.dataset.uid;
            try {
                const response = await fetch(`/project/${projectUid}/remix`, { method: 'POST' });
                if (response.status === 401) {
                    alert('Please log in to remix a project.');
                    window.location.href = '/login';
                    return;
                }
                const data = await response.json();
                if (data.success) {
                    window.location.href = `/editor/${data.new_project_id}`;
                } else {
                    alert(`Could not remix project: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error remixing project:', error);
            }
        });
    }

    // --- Public Code Viewer Tabs ---
    const codeTabs = document.querySelectorAll('.code-tab-btn');
    const codePanels = document.querySelectorAll('.code-panel');
    codeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            codeTabs.forEach(t => t.classList.remove('active'));
            codePanels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });
});