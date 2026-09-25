/* KAYVA Testimonial Carousel — vanilla custom element, no dependencies. */
(function () {
  'use strict';

  if (customElements.get('kayva-testimonials')) return;

  class KayvaTestimonials extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.kv-tstm__track');
      this.prevBtn = this.querySelector('[data-kv-prev]');
      this.nextBtn = this.querySelector('[data-kv-next]');
      this.counter = this.querySelector('[data-kv-counter]');
      this.cards = Array.from(this.querySelectorAll('.kv-tstm__card'));
      this.isStatic = this.classList.contains('kv-tstm__root--static');

      this.onScroll = this.update.bind(this);
      this.onResize = this.handleResize.bind(this);
      this.onPrev = this.scrollByCard.bind(this, -1);
      this.onNext = this.scrollByCard.bind(this, 1);
      this.onClick = this.handleClick.bind(this);

      this.initReadMore();
      this.initLightbox();

      this.addEventListener('click', this.onClick);

      if (this.track && !this.isStatic) {
        this.track.addEventListener('scroll', this.onScroll, { passive: true });
        if (this.prevBtn) this.prevBtn.addEventListener('click', this.onPrev);
        if (this.nextBtn) this.nextBtn.addEventListener('click', this.onNext);
      }

      if (this.track && 'ResizeObserver' in window) {
        this.lastWidth = -1;
        this.observer = new ResizeObserver((entries) => {
          var width = Math.round(entries[0].contentRect.width);
          if (width === this.lastWidth) return;
          this.lastWidth = width;
          this.handleResize();
        });
        this.observer.observe(this.track);
      } else {
        window.addEventListener('resize', this.onResize);
      }

      this.layout();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(this.onResize);
      }
    }

    disconnectedCallback() {
      if (this.track) this.track.removeEventListener('scroll', this.onScroll);
      if (this.observer) this.observer.disconnect();
      window.removeEventListener('resize', this.onResize);
      this.removeEventListener('click', this.onClick);
      if (this.prevBtn) this.prevBtn.removeEventListener('click', this.onPrev);
      if (this.nextBtn) this.nextBtn.removeEventListener('click', this.onNext);
      if (this.lightbox && this.lightbox.open) this.lightbox.close();
      cancelAnimationFrame(this.resizeFrame);
    }

    cardStep() {
      if (this.cards.length < 2) return this.track.clientWidth;
      return this.cards[1].offsetLeft - this.cards[0].offsetLeft;
    }

    scrollByCard(direction) {
      this.track.scrollBy({ left: this.cardStep() * direction });
    }

    handleResize() {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(this.layout.bind(this));
    }

    layout() {
      if (!this.track) return;
      this.updateReadMore();
      this.equalizeHeights();
      if (!this.isStatic) {
        // Not scrollable at this width: hide controls (space is kept, no CLS).
        var scrollable = this.track.scrollWidth > this.track.clientWidth + 2;
        var controls = this.querySelector('.kv-tstm__controls');
        if (controls) controls.style.visibility = scrollable ? 'visible' : 'hidden';
        this.update();
      }
    }

    // Equal heights per visual row, measured on collapsed cards only, so an
    // expanded card grows on its own without stretching its neighbours.
    equalizeHeights() {
      this.cards.forEach(function (card) { card.style.removeProperty('--kv-tstm-row-h'); });
      var rows = {};
      this.cards.forEach(function (card) {
        var top = card.offsetTop;
        (rows[top] = rows[top] || []).push(card);
      });
      Object.keys(rows).forEach(function (top) {
        var row = rows[top];
        if (row.length < 2) return;
        var max = 0;
        row.forEach(function (card) {
          if (card.querySelector('.is-expanded')) return;
          max = Math.max(max, card.offsetHeight);
        });
        if (!max) return;
        row.forEach(function (card) { card.style.setProperty('--kv-tstm-row-h', max + 'px'); });
      });
    }

    update() {
      if (!this.track) return;
      var maxScroll = this.track.scrollWidth - this.track.clientWidth;
      var pos = this.track.scrollLeft;
      if (this.prevBtn) this.prevBtn.disabled = pos <= 2;
      if (this.nextBtn) this.nextBtn.disabled = pos >= maxScroll - 2;
      if (this.counter && this.cards.length) {
        var index = Math.round(pos / Math.max(this.cardStep(), 1)) + 1;
        index = Math.min(Math.max(index, 1), this.cards.length);
        this.counter.textContent = index + ' / ' + this.cards.length;
      }
    }

    initReadMore() {
      this.querySelectorAll('.kv-tstm__text-wrap').forEach(function (wrap) {
        var body = wrap.querySelector('[data-kv-body]');
        var btn = wrap.querySelector('[data-kv-more]');
        if (!body || !btn || btn.dataset.kvBound) return;
        btn.dataset.kvBound = 'true';
        btn.addEventListener('click', function () {
          var expanded = body.classList.toggle('is-expanded');
          btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          btn.textContent = expanded ? 'Read less' : 'Read more';
        });
      });
    }

    // Show "Read more" only where the clamped text actually overflows at the
    // current width; expanded cards keep their button so they can collapse.
    updateReadMore() {
      this.querySelectorAll('.kv-tstm__text-wrap').forEach(function (wrap) {
        var body = wrap.querySelector('[data-kv-body]');
        var btn = wrap.querySelector('[data-kv-more]');
        if (!body || !btn || body.classList.contains('is-expanded')) return;
        btn.hidden = !(body.scrollHeight > body.clientHeight + 2);
      });
    }

    initLightbox() {
      this.lightbox = this.querySelector('[data-kv-lightbox]');
      if (!this.lightbox || this.lightbox.dataset.kvBound) return;
      this.lightbox.dataset.kvBound = 'true';
      this.lightboxImg = this.lightbox.querySelector('[data-kv-lightbox-img]');

      var self = this;
      this.lightbox.addEventListener('click', function (event) {
        // Clicks on the dialog itself (not the image) are backdrop clicks.
        if (event.target === self.lightbox || event.target.closest('[data-kv-lightbox-close]')) {
          self.lightbox.close();
        }
      });
      this.lightbox.addEventListener('close', function () {
        if (self.lastPhoto) self.lastPhoto.focus();
        self.lastPhoto = null;
      });
    }

    handleClick(event) {
      var photo = event.target.closest('[data-kv-photo]');
      if (!photo || !this.contains(photo)) return;
      if (!this.lightbox || typeof this.lightbox.showModal !== 'function') {
        window.open(photo.dataset.kvFull, '_blank', 'noopener');
        return;
      }
      this.lastPhoto = photo;
      if (photo.dataset.kvW && photo.dataset.kvH) {
        this.lightboxImg.width = photo.dataset.kvW;
        this.lightboxImg.height = photo.dataset.kvH;
      }
      this.lightboxImg.src = photo.dataset.kvFull;
      this.lightboxImg.alt = photo.dataset.kvAlt || '';
      this.lightbox.showModal();
    }
  }

  customElements.define('kayva-testimonials', KayvaTestimonials);
})();
