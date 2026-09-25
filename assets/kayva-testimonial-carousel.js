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

      this.onScroll = this.update.bind(this);
      this.onResize = this.handleResize.bind(this);
      this.onPrev = this.scrollByCard.bind(this, -1);
      this.onNext = this.scrollByCard.bind(this, 1);

      this.initReadMore();

      if (this.track && !this.classList.contains('kv-tstm__root--static')) {
        this.track.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onResize);
        if (this.prevBtn) this.prevBtn.addEventListener('click', this.onPrev);
        if (this.nextBtn) this.nextBtn.addEventListener('click', this.onNext);
        this.handleResize();
      }
    }

    disconnectedCallback() {
      if (this.track) this.track.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      if (this.prevBtn) this.prevBtn.removeEventListener('click', this.onPrev);
      if (this.nextBtn) this.nextBtn.removeEventListener('click', this.onNext);
    }

    cardStep() {
      if (this.cards.length < 2) return this.track.clientWidth;
      return this.cards[1].offsetLeft - this.cards[0].offsetLeft;
    }

    scrollByCard(direction) {
      this.track.scrollBy({ left: this.cardStep() * direction });
    }

    handleResize() {
      // Not scrollable at this width: behave statically, hide controls.
      var scrollable = this.track.scrollWidth > this.track.clientWidth + 2;
      var controls = this.querySelector('.kv-tstm__controls');
      if (controls) controls.style.visibility = scrollable ? 'visible' : 'hidden';
      this.update();
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
        if (!body || !btn) return;
        if (body.scrollHeight > body.clientHeight + 2) {
          btn.hidden = false;
          btn.addEventListener('click', function () {
            var expanded = body.classList.toggle('is-expanded');
            btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            btn.textContent = expanded ? 'Read less' : 'Read more';
          });
        }
      });
    }
  }

  customElements.define('kayva-testimonials', KayvaTestimonials);
})();
