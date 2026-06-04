/* KAYVA Theme — Main JS */

// ===== MOBILE NAV =====
class MobileNav {
  constructor() {
    this.toggle = document.querySelector('.menu-toggle');
    this.nav = document.querySelector('.mobile-nav');
    this.close = document.querySelector('.mobile-nav__close');
    if (!this.toggle) return;
    this.toggle.addEventListener('click', () => this.open());
    this.close?.addEventListener('click', () => this.closeNav());
  }
  open() {
    this.nav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  closeNav() {
    this.nav.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

// ===== HEADER SCROLL =====
class StickyHeader {
  constructor() {
    this.header = document.querySelector('.site-header');
    if (!this.header) return;
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }
  onScroll() {
    if (window.scrollY > 80) {
      this.header.classList.add('is-scrolled');
    } else {
      this.header.classList.remove('is-scrolled');
    }
  }
}

// ===== CART DRAWER =====
class CartDrawer {
  constructor() {
    this.drawer = document.querySelector('.cart-drawer');
    this.overlay = document.querySelector('.cart-drawer__overlay');
    this.closeBtns = document.querySelectorAll('[data-cart-close]');
    this.openBtns = document.querySelectorAll('[data-cart-open]');

    this.openBtns.forEach(btn => btn.addEventListener('click', () => this.open()));
    this.closeBtns.forEach(btn => btn.addEventListener('click', () => this.close()));
    this.overlay?.addEventListener('click', () => this.close());
  }
  open() {
    this.drawer?.classList.add('is-open');
    this.overlay?.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    this.fetchCart();
  }
  close() {
    this.drawer?.classList.remove('is-open');
    this.overlay?.classList.remove('is-visible');
    document.body.style.overflow = '';
  }
  async fetchCart() {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      this.renderCart(cart);
      this.updateCount(cart.item_count);
    } catch (e) {}
  }
  renderCart(cart) {
    const body = document.querySelector('.cart-drawer__items');
    if (!body) return;
    if (cart.item_count === 0) {
      body.innerHTML = '<p class="cart-drawer__empty">Your cart is empty.</p>';
      return;
    }
    body.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="cart-item__image">
          <img src="${item.image}" alt="${item.product_title}" width="80" height="80">
        </div>
        <div class="cart-item__details">
          <p class="cart-item__name">${item.product_title}</p>
          <p class="cart-item__variant">${item.variant_title !== 'Default Title' ? item.variant_title : ''}</p>
          <div class="cart-item__qty-row">
            <div class="qty-control">
              <button class="qty-btn" data-action="decrease" data-key="${item.key}">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-key="${item.key}">+</button>
            </div>
            <span class="cart-item__price">${this.formatMoney(item.final_line_price)}</span>
          </div>
        </div>
      </div>
    `).join('');
    body.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.updateQty(e));
    });
    const subtotal = document.querySelector('.cart-drawer__subtotal-value');
    if (subtotal) subtotal.textContent = this.formatMoney(cart.total_price);
  }
  async updateQty(e) {
    const btn = e.currentTarget;
    const key = btn.dataset.key;
    const action = btn.dataset.action;
    const qtyEl = btn.parentElement.querySelector('.qty-value');
    let qty = parseInt(qtyEl.textContent);
    qty = action === 'increase' ? qty + 1 : Math.max(0, qty - 1);
    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: qty })
      });
      this.fetchCart();
    } catch (e) {}
  }
  updateCount(count) {
    document.querySelectorAll('.cart-count__badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }
  formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }
}

// ===== ADD TO CART =====
class AddToCart {
  constructor() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-add-to-cart]') || e.target.closest('[data-add-to-cart]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-add-to-cart]') || e.target;
        this.addItem(btn);
      }
    });
  }
  async addItem(btn) {
    const variantId = btn.dataset.variantId || document.querySelector('[name="id"]')?.value;
    const qty = parseInt(document.querySelector('[name="quantity"]')?.value || 1);
    if (!variantId) return;
    btn.disabled = true;
    btn.textContent = 'Adding…';
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: qty })
      });
      if (res.ok) {
        btn.textContent = 'Added';
        setTimeout(() => {
          btn.textContent = btn.dataset.label || 'Add to Cart';
          btn.disabled = false;
        }, 1500);
        window.cartDrawer?.fetchCart();
        window.cartDrawer?.open();
      }
    } catch (e) {
      btn.textContent = 'Error';
      btn.disabled = false;
    }
  }
}

// ===== PRODUCT GALLERY =====
class ProductGallery {
  constructor() {
    this.main = document.querySelector('.product-gallery__main img');
    const thumbs = document.querySelectorAll('.product-gallery__thumb');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        if (this.main) this.main.src = thumb.dataset.src;
        thumbs.forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  }
}

// ===== VARIANT SELECTOR =====
class VariantSelector {
  constructor() {
    this.form = document.querySelector('[data-product-form]');
    if (!this.form) return;
    this.variantInput = this.form.querySelector('[name="id"]');
    const swatches = this.form.querySelectorAll('[data-variant-option]');
    swatches.forEach(sw => sw.addEventListener('change', () => this.update()));
    this.update();
  }
  update() {
    const selected = this.form.querySelectorAll('[data-variant-option]:checked');
    const values = Array.from(selected).map(s => s.value);
    const variantsData = JSON.parse(document.querySelector('[data-variants-json]')?.textContent || '[]');
    const match = variantsData.find(v =>
      values.every((val, i) => v.options[i] === val)
    );
    if (match && this.variantInput) {
      this.variantInput.value = match.id;
      const priceEl = document.querySelector('.product-price__current');
      if (priceEl) priceEl.textContent = '$' + (match.price / 100).toFixed(2);
      const addBtn = document.querySelector('[data-add-to-cart]');
      if (addBtn) {
        addBtn.disabled = !match.available;
        addBtn.textContent = match.available ? (addBtn.dataset.label || 'Add to Cart') : 'Sold Out';
      }
    }
  }
}

// ===== COLLECTION FILTERS =====
class CollectionFilters {
  constructor() {
    const filterForm = document.querySelector('[data-filter-form]');
    if (!filterForm) return;
    filterForm.addEventListener('change', () => filterForm.submit());
    const sortSelect = document.querySelector('[data-sort-by]');
    sortSelect?.addEventListener('change', () => filterForm.submit());
  }
}

// ===== NEWSLETTER =====
class Newsletter {
  constructor() {
    const forms = document.querySelectorAll('[data-newsletter-form]');
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('[name="contact[email]"]')?.value;
        if (!email) return;
        const msg = form.querySelector('.newsletter__message');
        try {
          const res = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(new FormData(form))
          });
          if (msg) {
            msg.textContent = 'Thank you for subscribing.';
            msg.style.color = 'var(--color-amber)';
          }
          form.reset();
        } catch (e) {
          if (msg) msg.textContent = 'Something went wrong. Please try again.';
        }
      });
    });
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  new MobileNav();
  new StickyHeader();
  window.cartDrawer = new CartDrawer();
  new AddToCart();
  new ProductGallery();
  new VariantSelector();
  new CollectionFilters();
  new Newsletter();
});
