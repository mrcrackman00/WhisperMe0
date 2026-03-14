/**
 * Blog article page — load content by slug, progress bar, related posts,
 * author bio, share buttons, SEO
 */
(function() {
  var slug = (new URLSearchParams(window.location.search)).get('slug') 
    || (window.location.hash ? window.location.hash.slice(1) : null);
  if (!slug || slug === 'null' || slug === 'undefined' || slug.length < 2) {
    window.location.replace('blog.html');
    return;
  }
  if (!window.BLOG_POSTS || !Array.isArray(window.BLOG_POSTS)) {
    window.location.replace('blog.html');
    return;
  }
  var post = window.BLOG_POSTS.find(function(p) { return p.slug === slug; });
  if (!post) {
    window.location.replace('blog.html');
    return;
  }

  var articleUrl = window.location.href.split('?')[0] + '?slug=' + encodeURIComponent(slug);

  document.title = post.title + ' — WhisperMe Blog';
  document.getElementById('articleCat').textContent = post.category;

  var schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'WhisperMe' }
  };
  if (post.publishedDate) schema.datePublished = post.publishedDate + 'T12:00:00Z';
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
  document.getElementById('articleTitle').textContent = post.title;
  document.getElementById('articleAuthor').textContent = post.author;
  document.getElementById('articleReadTime').textContent = post.readTime;
  document.getElementById('articleBody').innerHTML = post.body;

  var pubDate = post.publishedDate || '';
  var dateEl = document.getElementById('articleDate');
  if (pubDate) {
    var d = new Date(pubDate + 'T12:00:00');
    dateEl.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    dateEl.setAttribute('datetime', pubDate);
  } else {
    var dot = dateEl.previousElementSibling;
    if (dot && dot.classList.contains('blog-meta-dot')) dot.remove();
    dateEl.remove();
  }

  var hero = document.getElementById('articleHero');
  hero.style.background = post.gradient || 'linear-gradient(135deg,#1C1A18,#3a1a2a)';
  var heroIcon = document.getElementById('articleHeroIcon');
  if (heroIcon) heroIcon.textContent = post.icon || '📄';

  var author = window.BLOG_AUTHORS && window.BLOG_AUTHORS[post.authorKey || post.author];
  var bioEl = document.getElementById('authorBio');
  if (author) {
    bioEl.innerHTML = '<div class="blog-author-avatar">' + (author.avatar || author.name.charAt(0)) + '</div>' +
      '<div class="blog-author-info">' +
      '<strong class="blog-author-name">' + author.name + '</strong>' +
      '<span class="blog-author-role">' + author.role + '</span>' +
      '<p class="blog-author-desc">' + author.bio + '</p>' +
      '</div>';
  } else {
    bioEl.innerHTML = '';
    bioEl.style.display = 'none';
  }

  var shareTitle = encodeURIComponent(post.title);
  var shareText = encodeURIComponent(post.excerpt || post.title);
  document.getElementById('shareTwitter').href = 'https://twitter.com/intent/tweet?text=' + shareText + '&url=' + encodeURIComponent(articleUrl);
  document.getElementById('shareLinkedIn').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(articleUrl);

  if (document.getElementById('metaDescription')) {
    document.getElementById('metaDescription').content = post.excerpt || post.title;
    document.getElementById('ogTitle').content = post.title + ' — WhisperMe Blog';
    document.getElementById('ogDesc').content = post.excerpt || post.title;
    document.getElementById('canonicalUrl').href = articleUrl;
  }

  var related = window.getRelatedPosts ? window.getRelatedPosts(slug, 3) : [];
  var grid = document.getElementById('relatedGrid');
  related.forEach(function(r) {
    var a = document.createElement('a');
    a.href = 'blog-article.html?slug=' + encodeURIComponent(r.slug);
    a.className = 'sp-post blog-related-card reveal';
    a.setAttribute('tabindex', '0');
    a.innerHTML = '<div class="sp-post-img-wrap"><div class="sp-post-img-placeholder sp-post-icon" style="background:' + (r.gradient || 'linear-gradient(135deg,#1C1A18,#3a1a2a)') + '">' + (r.icon || '📄') + '</div></div>' +
      '<div class="sp-post-body">' +
      '<div class="sp-post-cat">' + r.category + '</div>' +
      '<h3 class="sp-post-title">' + r.title + '</h3>' +
      '<p class="sp-post-desc">' + r.excerpt + '</p>' +
      '<div class="sp-post-meta"><span>' + r.author + '</span><span>·</span><span>' + r.readTime + '</span></div>' +
      '</div>';
    a.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        a.click();
      }
    });
    grid.appendChild(a);
  });

  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.reveal').forEach(function(el) { revealObserver.observe(el); });

  var progressBar = document.getElementById('blogProgressBar');
  function updateProgress() {
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var pct = docH <= 0 ? 100 : Math.min(100, (scrollTop / docH) * 100);
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', Math.round(pct));
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
})();
