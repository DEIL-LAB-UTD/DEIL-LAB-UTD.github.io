
// Helper to fetch JSON
async function fetchData(file) {
    const response = await fetch(`data/${file}`);
    return await response.json();
}

// Render Profile
async function loadProfile() {
    // Skeletons
    document.getElementById('profile-name').innerHTML = '<div class="skeleton skeleton-title"></div>';
    document.getElementById('profile-bio').innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width:80%"></div>';

    const data = await fetchData('profile.json');
    document.getElementById('profile-name').textContent = data.name;
    // Highlight "Goals:" and other key terms if desired
    let bioData = data.bio;
    let bioHtml = '';

    if (Array.isArray(bioData)) {
        bioHtml = bioData.map(p => `<p style="margin-bottom: 1rem;">${p}</p>`).join('');
    } else {
        bioHtml = bioData;
    }

    bioHtml = bioHtml.replace('Goals:', '<span class="highlight-label">Goals:</span>');
    document.getElementById('profile-bio').innerHTML = bioHtml;

    const linksContainer = document.getElementById('profile-links');
    data.links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.textContent = link.text;
        a.className = 'btn';
        a.target = '_blank';
        linksContainer.appendChild(a);
    });

    // Openings / Hiring Note
    if (data.openings) {
        const openingsP = document.createElement('p');
        openingsP.className = 'fade-in';
        openingsP.style.marginTop = '1.5rem';
        openingsP.style.borderLeft = '3px solid var(--accent-color)';
        openingsP.style.paddingLeft = '1rem';
        openingsP.style.fontStyle = 'italic';
        openingsP.style.color = '#d73a49'; // Red for visibility
        openingsP.innerHTML = `<strong>Hiring:</strong> ${data.openings}`;
        document.querySelector('.hero-text').appendChild(openingsP);
    }

    // Also load research description here or separately
    const researchData = await fetchData('research.json');
    document.getElementById('research-desc').textContent = researchData.description;
}

// Render News
async function loadNews() {
    const data = await fetchData('news.json');
    const container = document.getElementById('news-list');
    // Take top 5 for simplicity or all
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'news-item fade-in';
        // Convert markdown links in content with simple regex
        const content = item.content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        div.innerHTML = `
      <div class="news-date">${item.date}</div>
      <div class="news-content">${content}</div>
    `;
        container.appendChild(div);
    });
}

// Render Publications
async function loadPublications() {
    const container = document.getElementById('publications-list');
    const filtersContainer = document.getElementById('publications-filters');

    // Show Skeleton
    container.innerHTML = `
        <div class="skeleton skeleton-card" style="margin-bottom: 2rem;"></div>
        <div class="skeleton skeleton-card" style="margin-bottom: 2rem;"></div>
        <div class="skeleton skeleton-card"></div>
    `;

    const data = await fetchData('publications.json');
    container.innerHTML = ''; // Clear skeleton

    // Handle both array (legacy) and object (new) structure
    const items = Array.isArray(data) ? data : data.items;

    // Extract Years
    const years = [...new Set(items.map(p => p.year).filter(y => y))].sort((a, b) => b - a);

    // Render Filters
    if (years.length > 0 && filtersContainer) {
        filtersContainer.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active';
        allBtn.textContent = 'All';
        allBtn.onclick = () => filterPubs('all', allBtn);
        filtersContainer.appendChild(allBtn);

        years.forEach(year => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = year;
            btn.onclick = () => filterPubs(year, btn);
            filtersContainer.appendChild(btn);
        });
    }

    function renderPubs(pubs) {
        container.innerHTML = '';
        pubs.forEach(pub => {
            const div = document.createElement('div');
            div.className = 'pub-item fade-in';

            let linksHtml = '';
            if (pub.links) {
                pub.links.forEach(link => {
                    linksHtml += `<a href="${link.url}" class="btn" style="font-size:0.8rem; padding:0.3rem 0.8rem; margin-right:0.5rem;" target="_blank">${link.text}</a>`;
                });
            }

            div.innerHTML = `
          <div class="pub-title">${pub.title}</div>
          <div class="pub-authors">${pub.authors}</div>
          <div>
            <span class="pub-venue">${pub.venue}</span>
            ${linksHtml}
          </div>
        `;
            container.appendChild(div);
        });
    }

    // Initial Render
    renderPubs(items);

    // Filter Logic
    window.filterPubs = (year, btn) => {
        // Update Active State
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter Data
        if (year === 'all') {
            renderPubs(items);
        } else {
            const filtered = items.filter(p => p.year == year);
            renderPubs(filtered);
        }
    };

    // Render note if present
    if (!Array.isArray(data) && data.note) {
        // Handle array or object
        const noteData = Array.isArray(data.note) ? data.note[0] : data.note;

        const noteDiv = document.createElement('div');
        noteDiv.className = 'fade-in';
        noteDiv.style.marginBottom = '1.5rem';
        noteDiv.style.textAlign = 'center';
        noteDiv.style.color = 'var(--text-secondary)';
        noteDiv.innerHTML = `<a href="${noteData.link}" target="_blank" style="text-decoration: underline; color: var(--accent-color);">${noteData.text}</a>`;

        // Insert before filters
        if (filtersContainer && filtersContainer.parentNode) {
            filtersContainer.parentNode.insertBefore(noteDiv, filtersContainer);
        } else {
            container.parentNode.insertBefore(noteDiv, container);
        }
    }
}

// Render Team
async function loadTeam() {
    const container = document.getElementById('team-list');
    container.innerHTML = `
        <div class="card-grid">
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
        </div>
    `;

    const data = await fetchData('team.json');

    // Group Photo
    let groupPhotoHtml = '';
    if (data.group_photo) {
        groupPhotoHtml = `<div class="fade-in" style="margin-bottom: 3rem; text-align: center;">
            <img src="${data.group_photo}" alt="Lab Group Photo" style="max-width: 80%; border-radius: 12px; border: 1px solid var(--card-border);">
        </div>`;
    }

    // Functions to render a category
    const renderCategory = (title, members) => {
        if (!members || members.length === 0) return '';

        let html = `<h3>${title}</h3><div class="card-grid">`;
        members.forEach(m => {
            let avatarHtml;
            if (m.image) {
                avatarHtml = `<div class="team-avatar"><img src="${m.image}" alt="${m.name}" class="team-avatar-img"></div>`;
            } else {
                const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2);
                avatarHtml = `<div class="team-avatar">${initials}</div>`;
            }

            html += `
        <a href="${m.link || '#'}" target="_blank" class="card team-member fade-in" style="color: inherit; text-decoration: none;">
            ${avatarHtml}
            <div class="team-info">
                <h4>${m.name}</h4>
                <p>${m.info}</p>
            </div>
        </a>
        `;
        });
        html += `</div>`;
        return html;
    };

    container.innerHTML =
        groupPhotoHtml +
        renderCategory('Principal Investigator (PI)', data.PI) +
        renderCategory('PhD Students', data.phd) +
        renderCategory('MS Students', data.master) +
        renderCategory('Undergraduate Students', data.undergrad) +
        renderCategory('Interns', data.intern) +
        renderCategory('Alumni', data.alumni);

    // Render note if present
    if (data.note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'fade-in';
        noteDiv.style.marginTop = '2rem';
        noteDiv.style.textAlign = 'center';
        noteDiv.style.color = '#d73a49'; // Red for visibility
        noteDiv.style.fontStyle = 'italic';

        // Handle object or string
        if (typeof data.note === 'string') {
            noteDiv.textContent = data.note;
        } else {
            const noteText = data.note.text || '';
            const noteLink = data.note.link || '#';
            noteDiv.innerHTML = `<a href="${noteLink}" target="_blank" style="text-decoration: underline; color: var(--accent-color);">${noteText}</a>`;
        }
        container.appendChild(noteDiv);
    }
}

// Render Teaching
async function loadTeaching() {
    const container = document.getElementById('teaching-list');
    container.innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>';

    const data = await fetchData('teaching.json');
    container.innerHTML = '';

    // Header for role usually implied, but we can add if needed. 
    // Since user wants compact, we just list them.
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';

    // Handle array of strings
    if (Array.isArray(data)) {
        // Add a label if desired, or just list
        const label = document.createElement('div');
        label.className = 'fade-in';
        label.innerHTML = '<strong style="color:var(--text-primary)">Instructor</strong>';
        label.style.marginBottom = '0.5rem';
        container.appendChild(label);

        data.forEach(courseStr => {
            const li = document.createElement('li');
            li.className = 'fade-in';
            li.style.marginBottom = '0.5rem';
            li.style.marginLeft = '1rem';
            li.style.color = 'var(--text-secondary)';
            li.textContent = courseStr; // simple text
            ul.appendChild(li);
        });
    } else if (data.courses) {
        // Legacy support just in case, or remove
        data.courses.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `${c.course}`;
            ul.appendChild(li);
        });
    }
    container.appendChild(ul);
}

// Render Sponsors
async function loadSponsors() {
    const container = document.getElementById('sponsors-list');
    container.innerHTML = `<div class="skeleton skeleton-text" style="height: 100px; width: 100%;"></div>`;

    const data = await fetchData('sponsors.json');

    // Handle array or object
    const items = Array.isArray(data) ? data : data.items;

    // Create grid container
    const gridDiv = document.createElement('div');
    gridDiv.className = 'sponsors-grid';
    container.innerHTML = ''; // Clear prev
    container.appendChild(gridDiv);

    items.forEach(sponsor => {
        const a = document.createElement('a');
        a.href = sponsor.url || '#'; // Handle missing URL
        if (sponsor.url) a.target = '_blank';
        a.className = 'sponsor-item fade-in';
        if (!sponsor.url) a.style.cursor = 'default';

        // Use image if available, else text
        if (sponsor.image) {
            const img = document.createElement('img');
            img.src = sponsor.image;
            img.alt = sponsor.name;
            img.className = 'sponsor-logo';
            a.appendChild(img);
        } else {
            a.textContent = sponsor.name;
            a.style.display = 'block';
            a.style.padding = '1rem';
            a.style.border = '1px solid var(--card-border)';
            a.style.borderRadius = '8px';
            a.style.textAlign = 'center';
            a.style.color = 'var(--text-primary)';
        }
        gridDiv.appendChild(a);
    });

    // Render note if present
    if (!Array.isArray(data) && data.note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'fade-in';
        noteDiv.style.marginTop = '2rem';
        noteDiv.style.textAlign = 'center';
        noteDiv.style.color = 'var(--text-secondary)';
        noteDiv.textContent = data.note;
        container.appendChild(noteDiv);
    }
}

// Main Init
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    // loadNews(); // User removed nav link, keep loading or remove if desired. 
    // Keeping it doesn't hurt if section is gone from HTML, but let's leave it.
    // Actually user might still have the section in HTML but just removed link.
    // I will check if section exists before erroring? 
    // The current fetchData doesn't error if element missing, document.getElementById returns null. 
    // Wait, document.getElementById('news-list') might be null if user deleted section.
    // Step 60 removed the news section. So loadNews will fail if I don't check for existence.
    // I should fix loadNews too or just comment it out. I'll leave it but wrap in check or just let it fail silently? 
    // Better to just call valid loaders.

    // Check if news section exists
    if (document.getElementById('news-list')) loadNews();

    loadPublications();
    loadTeam();
    loadTeaching();
    loadSponsors();

    // Smooth scroll
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Back to Top Logic
    const backToTopBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
