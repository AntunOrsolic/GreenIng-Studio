// ============================================
// STICKY HEADER
// ============================================
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.getElementById('nav');
const navList = nav.querySelector('.nav-list');
const navLinks = document.querySelectorAll('.nav-link');

mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    navList.classList.toggle('active');
    document.body.style.overflow = navList.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuToggle.classList.remove('active');
        navList.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && navList.classList.contains('active')) {
        mobileMenuToggle.classList.remove('active');
        navList.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============================================
// SMOOTH SCROLLING FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const headerOffset = 168; /* 60px top bar + header */
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// ACTIVE NAVIGATION LINK ON SCROLL
// ============================================
const sections = document.querySelectorAll('section[id]');

function setActiveNavLink() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 168; /* 60px top bar + header */
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
}

window.addEventListener('scroll', setActiveNavLink);

// ============================================
// FADE-IN ANIMATION ON SCROLL
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

function observeFadeInEl(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    el.style.transitionDelay = '0s';
    observer.observe(el);
}

// ============================================
// VIJESTI — Headless WordPress (WPGraphQL)
// ============================================
const CMS_GRAPHQL_URL = 'https://cms.greeningstudio.hr/graphql';
const CMS_PUBLIC_ORIGIN = 'https://cms.greeningstudio.hr';

const NEWS_POSTS_QUERY = `
query GreenIngNews($first: Int!, $after: String) {
  posts(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      databaseId
      title
      excerpt
      uri
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
}
`;

function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function pickRendered(field) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && typeof field.rendered === 'string') {
        return field.rendered;
    }
    return String(field);
}

function buildPostUrl(uri) {
    if (!uri) return CMS_PUBLIC_ORIGIN;
    try {
        return new URL(uri, CMS_PUBLIC_ORIGIN).href;
    } catch {
        return CMS_PUBLIC_ORIGIN + (uri.startsWith('/') ? uri : `/${uri}`);
    }
}

async function wpGraphql(query, variables) {
    const res = await fetch(CMS_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
        credentials: 'omit',
    });

    let json;
    try {
        json = await res.json();
    } catch {
        throw new Error('Neispravan odgovor poslužitelja.');
    }

    if (json.errors && json.errors.length) {
        throw new Error(json.errors.map((e) => e.message).join(' '));
    }

    if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status}`);
    }

    return json.data;
}

function initNewsSection() {
    const newsGrid = document.getElementById('newsGrid');
    const loadMoreBtn = document.getElementById('loadMoreNews');
    const newsError = document.getElementById('newsError');

    if (!newsGrid || !loadMoreBtn || !newsError) {
        return;
    }

    const perPage = 3;
    let endCursor = null;

    function setError(message) {
        if (message) {
            newsError.textContent = message;
            newsError.hidden = false;
        } else {
            newsError.textContent = '';
            newsError.hidden = true;
        }
    }

    function renderPosts(nodes) {
        nodes.forEach((post) => {
            const title =
                stripHtml(pickRendered(post.title)) || 'Vijest';
            const excerptRaw = stripHtml(pickRendered(post.excerpt));
            const excerpt =
                excerptRaw.length > 0
                    ? excerptRaw.length > 160
                        ? `${excerptRaw.slice(0, 160).trim()}…`
                        : excerptRaw
                    : 'Pročitajte cijeli članak na stranici vijesti.';

            const img = post.featuredImage?.node?.sourceUrl;
            const imgAlt = post.featuredImage?.node?.altText || title;
            const href = buildPostUrl(post.uri);

            const article = document.createElement('article');
            article.className = 'news-card fade-in';
            article.setAttribute('data-post-id', String(post.databaseId));

            const link = document.createElement('a');
            link.className = 'news-card-link';
            link.href = href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const media = document.createElement('div');
            media.className = 'news-card-media';
            if (img) {
                const imageEl = document.createElement('img');
                imageEl.src = img;
                imageEl.alt = imgAlt;
                imageEl.loading = 'lazy';
                imageEl.width = 640;
                imageEl.height = 400;
                media.appendChild(imageEl);
            } else {
                media.setAttribute('aria-hidden', 'true');
            }

            const body = document.createElement('div');
            body.className = 'news-card-body';

            const h3 = document.createElement('h3');
            h3.className = 'news-card-title';
            h3.textContent = title;

            const p = document.createElement('p');
            p.className = 'news-excerpt';
            p.textContent = excerpt;

            const more = document.createElement('span');
            more.className = 'news-readmore';
            more.textContent = 'Pročitaj više';

            body.appendChild(h3);
            body.appendChild(p);
            body.appendChild(more);
            link.appendChild(media);
            link.appendChild(body);
            article.appendChild(link);

            newsGrid.appendChild(article);
            observeFadeInEl(article);
        });
    }

    async function loadPage(afterCursor) {
        const variables = { first: perPage };
        if (afterCursor) {
            variables.after = afterCursor;
        }
        return wpGraphql(NEWS_POSTS_QUERY, variables);
    }

    async function fetchAndAppend(isInitial) {
        setError('');
        loadMoreBtn.disabled = true;
        const prevLabel = loadMoreBtn.textContent;
        if (!isInitial) {
            loadMoreBtn.textContent = 'Učitava se…';
        }

        try {
            const data = await loadPage(isInitial ? null : endCursor);
            const conn = data?.posts;
            if (!conn) {
                throw new Error('Neočekivan odgovor CMS-a.');
            }

            const nodes = conn.nodes || [];
            if (isInitial && nodes.length === 0) {
                newsGrid.innerHTML =
                    '<p class="news-empty">Trenutačno nema objavljenih vijesti.</p>';
                loadMoreBtn.hidden = true;
                return;
            }

            renderPosts(nodes);

            endCursor = conn.pageInfo?.endCursor || null;
            const hasNext = Boolean(conn.pageInfo?.hasNextPage);
            loadMoreBtn.hidden = !hasNext;
        } catch (err) {
            if (isInitial) {
                newsGrid.innerHTML = '';
                setError(
                    err?.message
                        ? `Vijesti se trenutačno ne mogu učitati (${err.message}). Provjerite CORS na CMS-u ili pokušajte kasnije.`
                        : 'Vijesti se trenutačno ne mogu učitati. Pokušajte kasnije.'
                );
                loadMoreBtn.hidden = true;
            } else {
                setError(
                    err?.message
                        ? `Učitavanje nije uspjelo: ${err.message}`
                        : 'Učitavanje nije uspjelo.'
                );
            }
        } finally {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = prevLabel;
        }
    }

    loadMoreBtn.addEventListener('click', () => {
        fetchAndAppend(false);
    });

    void fetchAndAppend(true);
}

// Observe all fade-in elements
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
});

// ============================================
// CONTACT FORM HANDLING
// ============================================
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Šalje se...';
        formMessage.style.display = 'none';
        
        try {
            const response = await fetch('contact.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                formMessage.textContent = 'Poruka je uspješno poslana! Kontaktirat ćemo vas uskoro.';
                formMessage.className = 'form-message success';
                formMessage.style.display = 'block';
                contactForm.reset();
                
                // Scroll to message
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                formMessage.textContent = result.message || 'Došlo je do greške. Molimo pokušajte ponovno.';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
            }
        } catch (error) {
            formMessage.textContent = 'Došlo je do greške pri slanju poruke. Molimo pokušajte ponovno.';
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// ============================================
// GALLERY LIGHTBOX (Optional enhancement)
// ============================================
const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
            // Simple lightbox could be added here
            // For now, just a console log
            console.log('Gallery item clicked:', img.alt);
        }
    });
});

// ============================================
// PERFORMANCE: Lazy loading images
// ============================================
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Set initial active nav link
    setActiveNavLink();
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    initNewsSection();
});

