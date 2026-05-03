(function() {
  const savedTheme = localStorage.getItem('verveTheme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

const STORAGE_KEYS = {
  cart: 'verveCart',
  orders: 'verveOrders'
};

const PAGE_KEY = document.body.dataset.page || (() => {
  const name = window.location.pathname.split('/').pop() || 'index.html';
  return name.replace('.html', '') || 'index';
})();

const HERO_IMAGES = {
  tops: 'https://res.cloudinary.com/dnkfg07ov/image/upload/v1776860462/download_60_jfzp3h.jpg',
  dresses: 'https://res.cloudinary.com/dnkfg07ov/image/upload/v1777340532/Verve_Co._2_t8aoqj.png',
  pants: 'https://res.cloudinary.com/dnkfg07ov/image/upload/v1776848386/download_43_rgokk7.jpg',
  checkout: 'https://res.cloudinary.com/dnkfg07ov/image/upload/v1776700993/download_56_oyuurl.jpg',
  contact: 'https://res.cloudinary.com/dnkfg07ov/image/upload/v1776848104/Asymmetrical_Twist_Top_And_High_Waist_Maxi_Skirt_Set_cagn7u.jpg'
};

const FILTER_GROUPS = {
  tops: [
    {
      key: 'style',
      label: 'Style',
      options: ['button', 'silk', 'linen', 'halter-neck', 'strapless', 'asymmetric', 'asymmetrical', 'knit', 'blouse', 'wrap', 'corset', 'waistcoat', 'tube-top', 'leather', 'mesh', 'net', 'draped', 'shirt', 'bodycon']
    },
    {
      key: 'tone',
      label: 'Colour',
      options: ['black', 'white', 'olive', 'grey', 'blue', 'pink', 'brown', 'wine', 'green']
    },
    {
      key: 'occasion',
      label: 'Mood',
      options: ['casual', 'formal']
    },
    {
      key: 'feature',
      label: 'Feature',
      options: ['long-sleeve', 'sleeveless', 'asymmetrical', 'necktie']
    }
  ],
  dresses: [
    {
      key: 'length',
      label: 'Length',
      options: ['mini', 'midi', 'maxi', 'short', 'long', 'a-line', 'wrap', 'shirt-dress', 'slip-dress']
    },
    {
      key: 'occasion',
      label: 'Mood',
      options: ['casual', 'formal', 'party', 'denim', 'floral', 'strapless']
    },
    {
      key: 'colour',
      label: 'Colour',
      options: ['black', 'white', 'red', 'green', 'blue', 'brown', 'cream', 'olive', 'yellow', 'wine', 'purple', 'grey']
    },
    {
      key: 'detail',
      label: 'Detail',
      options: ['bodycon', 'pleated', 'ruched', 'lace', 'chiffon', 'brocade', 'bow', 'pattern', 'print', 'halter-neck', 'cowl-neckline', 'collared', 'ruffle']
    }
  ],
  pants: [
    {
      key: 'fit',
      label: 'Fit',
      options: ['wide-leg', 'wide', 'straight', 'barrel', 'cargo', 'joggers', 'tailored', 'high-waisted']
    },
    {
      key: 'tone',
      label: 'Colour',
      options: ['black', 'white', 'blue', 'brown', 'green', 'grey', 'khaki', 'olive', 'cream', 'pink', 'raven', 'coal']
    },
    {
      key: 'material',
      label: 'Material',
      options: ['denim', 'corduroy', 'cotton', 'leather', 'metallic', 'velvet']
    },
    {
      key: 'style',
      label: 'Style',
      options: ['short', 'camo', 'cargo', 'pleated', 'pattern', 'print', 'stripe', 'laser-cut']
    }
  ]
};

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PRICE_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

function formatPrice(value) {
  return PRICE_FORMATTER.format(Number(value) || 0);
}

function parsePrice(value) {
  return Number(String(value).replace(/[^\d]/g, '')) || 0;
}

function slugTokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/https?:\/\/[^/]+\//g, '')
    .replace(/[_/()%.,-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function getStoredJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function setStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'success-message';
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = '0';
    window.setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function ensureCartShell() {
  if (document.querySelector('.cart-panel')) {
    return;
  }

  document.body.insertAdjacentHTML(
    'beforeend',
    `
      <div class="cart-overlay"></div>
      <aside class="cart-panel" aria-hidden="true">
        <div class="cart-header">
          <h2>Your Cart</h2>
          <button class="cart-close" aria-label="Close cart">&times;</button>
        </div>
        <div class="cart-items"></div>
        <div class="cart-footer">
          <div class="cart-subtotal">
            <span class="cart-subtotal-label">Subtotal</span>
            <span class="cart-subtotal-amount">${formatPrice(0)}</span>
          </div>
          <button class="cart-checkout-btn">Checkout</button>
        </div>
      </aside>
    `
  );
}

class ShoppingCart {
  constructor() {
    this.items = getStoredJson(STORAGE_KEYS.cart, []);
    this.cartToggle = document.querySelector('.cart-toggle');
    this.cartPanel = document.querySelector('.cart-panel');
    this.cartOverlay = document.querySelector('.cart-overlay');
    this.cartItems = document.querySelector('.cart-items');
    this.cartFooter = document.querySelector('.cart-footer');
    this.cartCount = document.querySelector('.cart-count');
    this.subtotalAmount = document.querySelector('.cart-subtotal-amount');
  }

  save() {
    setStoredJson(STORAGE_KEYS.cart, this.items);
  }

  getCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  addItem(product) {
    const existing = this.items.find((item) =>
      item.id === product.id && item.size === product.size
    );

    if (existing) {
      existing.quantity += product.quantity;
    } else {
      this.items.push(product);
    }

    this.save();
    this.render();
    this.open();
    showToast('Item added to cart');
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.save();
    this.render();
    updateCheckoutSummary();
  }

  changeQuantity(index, delta) {
    const item = this.items[index];
    if (!item) {
      return;
    }

    item.quantity = Math.max(1, item.quantity + delta);
    if (item.quantity <= 0) {
      this.items.splice(index, 1);
    }

    this.save();
    this.render();
    updateCheckoutSummary();
  }

  clear() {
    this.items = [];
    this.save();
    this.render();
  }

  open() {
    if (!this.cartPanel || !this.cartOverlay) {
      return;
    }

    this.cartPanel.classList.add('open');
    this.cartPanel.setAttribute('aria-hidden', 'false');
    this.cartOverlay.classList.add('active');
    document.body.classList.add('cart-open');
  }

  close() {
    if (!this.cartPanel || !this.cartOverlay) {
      return;
    }

    this.cartPanel.classList.remove('open');
    this.cartPanel.setAttribute('aria-hidden', 'true');
    this.cartOverlay.classList.remove('active');
    document.body.classList.remove('cart-open');
  }

  toggle() {
    if (this.cartPanel?.classList.contains('open')) {
      this.close();
      return;
    }

    this.open();
  }

  render() {
    const itemCount = this.getCount();
    if (this.cartCount) {
      this.cartCount.textContent = itemCount;
      this.cartCount.style.display = itemCount ? 'flex' : 'none';
    }

    if (this.subtotalAmount) {
      this.subtotalAmount.textContent = formatPrice(this.getSubtotal());
    }

    if (!this.cartItems || !this.cartFooter) {
      return;
    }

    if (!this.items.length) {
      this.cartItems.innerHTML = '<div class="cart-empty">Your cart is empty. Pick a piece to get started.</div>';
      this.cartFooter.style.display = 'none';
      return;
    }

    this.cartFooter.style.display = 'block';
    this.cartItems.innerHTML = this.items
      .map((item, index) => `
        <article class="cart-item">
          <img src="${item.image}" alt="Product image" class="cart-item-image">
          <div class="cart-item-details">
            <p class="cart-item-meta">${escapeHtml(item.description)}</p>
            <p class="cart-item-meta">Size: ${escapeHtml(item.size)}</p>
            <div class="cart-item-actions">
              <button class="cart-item-btn cart-item-decrease" data-index="${index}" type="button" aria-label="Decrease quantity">-</button>
              <span class="cart-item-qty">${item.quantity}</span>
              <button class="cart-item-btn cart-item-increase" data-index="${index}" type="button" aria-label="Increase quantity">+</button>
              <button class="cart-item-remove" data-index="${index}" type="button" aria-label="Remove item"><i class="fa-solid fa-trash"></i></button>
            </div>
            <p class="cart-item-price">${formatPrice(item.price * item.quantity)}</p>
          </div>
        </article>
      `)
      .join('');
  }

  bindEvents() {
    document.addEventListener('click', (event) => {
      const removeButton = event.target.closest('.cart-item-remove');
      if (removeButton) {
        this.removeItem(Number(removeButton.dataset.index));
        return;
      }

      const decreaseButton = event.target.closest('.cart-item-decrease');
      if (decreaseButton) {
        this.changeQuantity(Number(decreaseButton.dataset.index), -1);
        return;
      }

      const increaseButton = event.target.closest('.cart-item-increase');
      if (increaseButton) {
        this.changeQuantity(Number(increaseButton.dataset.index), 1);
        return;
      }

      if (event.target.closest('.cart-toggle')) {
        this.toggle();
        return;
      }

      if (event.target.closest('.cart-close') || event.target.classList.contains('cart-overlay')) {
        this.close();
        return;
      }

      if (event.target.closest('.cart-checkout-btn')) {
        if (!this.items.length) {
          showToast('Your cart is empty right now.');
          return;
        }

        window.location.href = 'checkout.html';
      }
    });
  }
}

function hydrateProducts() {
  document.querySelectorAll('.product-card').forEach((card, index) => {
    const image = card.querySelector('.product-image img');
    const descriptionElement = card.querySelector('.product-description');
    const priceElement = card.querySelector('.product-price');
    const title = '';
    const description = descriptionElement?.textContent?.trim() || 'Product details';
    const price = parsePrice(priceElement?.textContent);
    const manualTags = (card.getAttribute('data-tags') || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const sourceTokens = slugTokens(`${description} ${image?.src || ''}`);

    if (image && (!image.alt || image.alt === 'Final Say' || image.alt === 'Product image')) {
      image.alt = description;
    }

    card.dataset.productId = `${PAGE_KEY}-${index + 1}`;
    card.dataset.title = title;
    card.dataset.description = description;
    card.dataset.price = String(price);
    card.dataset.image = image?.src || '';
    card.dataset.tags = manualTags || sourceTokens;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Open product details');

    if (priceElement) {
      priceElement.textContent = formatPrice(price);
    }
  });
}

function getProductFromCard(card) {
  return {
    id: card.dataset.productId,
    title: card.dataset.title,
    description: card.dataset.description,
    price: Number(card.dataset.price),
    image: card.dataset.image
  };
}

function closeProductModal() {
  const modal = document.querySelector('.product-modal-overlay');
  if (!modal) {
    return;
  }

  modal.remove();
  document.body.classList.remove('modal-open');
}

function openProductModal(card) {
  const product = getProductFromCard(card);
  closeProductModal();

  document.body.insertAdjacentHTML(
    'beforeend',
    `
      <div class="product-modal-overlay">
        <div class="product-modal" role="dialog" aria-modal="true" aria-label="Product details">
          <button class="modal-close" type="button" aria-label="Close product details">&times;</button>
          <div class="modal-content">
            <div class="modal-image">
              <img src="${product.image}" alt="Product image">
            </div>
            <div class="modal-details">
              <p class="modal-kicker">Product Details</p>
              <p class="modal-description">${escapeHtml(product.description)}</p>
              <p class="modal-price">${formatPrice(product.price)}</p>
              <form class="modal-form">
                <div class="form-group">
                  <label for="modal-size">Size</label>
                  <select id="modal-size" class="size-select" required>
                    <option value="">Select size</option>
                    ${SIZE_OPTIONS.map((size) => `<option value="${size}">${size}</option>`).join('')}
                  </select>
                  <span class="field-error" aria-live="polite"></span>
                </div>
                <div class="form-group">
                  <label for="modal-quantity">Quantity</label>
                  <div class="quantity-selector">
                    <button type="button" class="qty-btn qty-minus" aria-label="Decrease quantity">-</button>
                    <input id="modal-quantity" type="number" class="quantity-input" value="1" min="1" max="10">
                    <button type="button" class="qty-btn qty-plus" aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="modal-note">Styling or delivery note</label>
                  <textarea id="modal-note" class="modal-note" rows="3" placeholder="Optional note for this item"></textarea>
                </div>
                <button type="submit" class="modal-add-to-cart">Add to Cart</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `
  );

  document.body.classList.add('modal-open');
  const modal = document.querySelector('.product-modal-overlay');
  const quantityInput = modal.querySelector('.quantity-input');
  const sizeSelect = modal.querySelector('.size-select');
  const sizeError = modal.querySelector('.field-error');
  const noteInput = modal.querySelector('.modal-note');

  sizeSelect.addEventListener('invalid', (event) => {
    event.preventDefault();
    const message = 'Please choose a size before adding this item to your cart.';
    sizeSelect.setCustomValidity(message);
    sizeError.textContent = message;
  });

  sizeSelect.addEventListener('input', () => {
    sizeSelect.setCustomValidity('');
    sizeError.textContent = '';
  });

  sizeSelect.addEventListener('change', () => {
    sizeSelect.setCustomValidity('');
    sizeError.textContent = '';
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('.modal-close')) {
      closeProductModal();
    }
  });

  modal.querySelector('.qty-minus').addEventListener('click', () => {
    quantityInput.value = String(Math.max(1, Number(quantityInput.value) - 1));
  });

  modal.querySelector('.qty-plus').addEventListener('click', () => {
    quantityInput.value = String(Math.min(10, Number(quantityInput.value) + 1));
  });

  modal.querySelector('.modal-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!sizeSelect.value) {
      const message = 'Please choose a size before adding this item to your cart.';
      sizeSelect.setCustomValidity(message);
      sizeError.textContent = message;
      sizeError.classList.add('field-error-active');
      sizeSelect.reportValidity();
      sizeSelect.focus();
      return;
    }

    window.cart.addItem({
      ...product,
      note: noteInput.value.trim(),
      size: sizeSelect.value,
      quantity: Math.max(1, Number(quantityInput.value) || 1)
    });
    closeProductModal();
  });
}

function bindProductCards() {
  const grid = document.querySelector('.products-grid');
  if (!grid) {
    return;
  }

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.product-card');
    if (!card) {
      return;
    }

    openProductModal(card);
  });

  grid.addEventListener('keydown', (event) => {
    const card = event.target.closest('.product-card');
    if (!card) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProductModal(card);
    }
  });
}

class CatalogView {
  constructor(cards) {
    this.cards = cards;
    this.filteredCards = [...cards];
    this.filters = {};
    this.currentPage = 1;
    this.perPage = 12;
    this.pagination = null;
  }

  init() {
    this.renderFilters();
    this.render();
  }

  renderFilters() {
    const groups = FILTER_GROUPS[PAGE_KEY];
    const hero = document.querySelector('.category-hero');
    if (!groups || !hero) {
      return;
    }

    const controls = document.createElement('section');
    controls.className = 'product-filters';
    controls.innerHTML = `
      <button class="filters-toggle" type="button" aria-expanded="false">
        <span>Filter Collection</span>
        <span class=\"filters-toggle-icon\" aria-hidden=\"true\"><i class=\"fas fa-sliders\"></i></span>
      </button>
      <div class="filters-panel">
        ${groups.map((group) => `
          <label class="filter-select-wrap">
            <span class="filter-group-title">${group.label}</span>
            <select class="filter-select" data-group="${group.key}">
              <option value="">All ${group.label}</option>
              ${group.options.map((option) => `
                <option value="${option}">${option}</option>
              `).join('')}
            </select>
          </label>
        `).join('')}
        <button class="filter-btn clear-filters" type="button">Clear Filters</button>
      </div>
    `;

    const grid = document.querySelector('.products-grid');
    if (grid) {
      grid.insertAdjacentElement('beforebegin', controls);
    } else {
      hero.insertAdjacentElement('afterend', controls);
    }

    const toggle = controls.querySelector('.filters-toggle');
    const panel = controls.querySelector('.filters-panel');

    toggle.addEventListener('click', () => {
      const isOpen = controls.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.querySelector('.filters-toggle-icon').innerHTML = isOpen ? '<i class=\"fas fa-times\"></i>' : '<i class=\"fas fa-sliders\"></i>';
    });

    controls.addEventListener('change', (event) => {
      const select = event.target.closest('.filter-select');
      if (!select) {
        return;
      }

      const { group } = select.dataset;
      if (select.value) {
        this.filters[group] = select.value;
      } else {
        delete this.filters[group];
      }

      this.currentPage = 1;
      this.applyFilters();
    });

    controls.addEventListener('click', (event) => {
      const clearButton = event.target.closest('.clear-filters');
      if (!clearButton) {
        return;
      }

      this.filters = {};
      controls.querySelectorAll('.filter-select').forEach((select) => {
        select.value = '';
      });
      this.currentPage = 1;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredCards = this.cards.filter((card) => {
      const tags = card.dataset.tags || '';
      return Object.values(this.filters).every((value) => tags.includes(value));
    });

    this.render();
  }

  ensurePagination() {
    const grid = document.querySelector('.products-grid');
    if (!grid) {
      return;
    }

    document.querySelectorAll('.pagination').forEach((item) => item.remove());
    this.pagination = null;

    if (this.filteredCards.length <= this.perPage) {
      this.pagination = null;
      return;
    }

    this.pagination = document.createElement('div');
    this.pagination.className = 'pagination';
    grid.insertAdjacentElement('afterend', this.pagination);

    this.pagination.addEventListener('click', (event) => {
      const pageButton = event.target.closest('[data-page]');
      if (pageButton) {
        this.currentPage = Number(pageButton.dataset.page);
        this.render(true);
        return;
      }

      if (event.target.closest('.prev-btn') && this.currentPage > 1) {
        this.currentPage -= 1;
        this.render(true);
      }

      if (event.target.closest('.next-btn') && this.currentPage < this.getPageCount()) {
        this.currentPage += 1;
        this.render(true);
      }
    });
  }

  getPageCount() {
    return Math.max(1, Math.ceil(this.filteredCards.length / this.perPage));
  }

  renderPagination() {
    if (!this.pagination) {
      return;
    }

    const pageCount = this.getPageCount();
    this.pagination.innerHTML = `
      <div class="pagination-numbers">
        ${Array.from({ length: pageCount }, (_, index) => {
          const page = index + 1;
          return `
            <button class="page-number ${page === this.currentPage ? 'active' : ''}" type="button" data-page="${page}">
              ${page}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  render(shouldScroll = false) {
    const pageCount = this.getPageCount();
    this.currentPage = Math.min(this.currentPage, pageCount);
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;

    this.cards.forEach((card) => {
      card.classList.add('is-hidden');
      card.setAttribute('aria-hidden', 'true');
    });

    this.filteredCards.slice(start, end).forEach((card) => {
      card.classList.remove('is-hidden');
      card.classList.add('fade-in');
      card.setAttribute('aria-hidden', 'false');
    });

    const grid = document.querySelector('.products-grid');
    let emptyState = document.querySelector('.catalog-empty-state');
    if (!this.filteredCards.length) {
      if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.className = 'catalog-empty-state';
        grid.insertAdjacentElement('afterend', emptyState);
      }

      emptyState.innerHTML = '<p>No pieces match those filters yet. Try a different combination.</p>';
    } else if (emptyState) {
      emptyState.remove();
    }

    this.ensurePagination();
    this.renderPagination();

    if (shouldScroll) {
      grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function applyHeroImages() {
  const categoryHero = document.querySelector('.category-hero');
  if (categoryHero && HERO_IMAGES[PAGE_KEY]) {
    categoryHero.style.backgroundImage = `linear-gradient(135deg, rgba(85, 107, 47, 0.74), rgba(10, 10, 10, 0.76)), url('${HERO_IMAGES[PAGE_KEY]}')`;
  }

  const subpageHero = document.querySelector('.subpage-hero');
  if (subpageHero && HERO_IMAGES[PAGE_KEY]) {
    subpageHero.style.backgroundImage = `linear-gradient(135deg, rgba(85, 107, 47, 0.72), rgba(10, 10, 10, 0.78)), url('${HERO_IMAGES[PAGE_KEY]}')`;
  }
}

function initMobileNav() {
  const header = document.querySelector('header');
  const nav = header?.querySelector('nav');
  if (!header || !nav || header.querySelector('.mobile-menu-toggle')) {
    return;
  }

  const cartToggle = header.querySelector('.cart-toggle');

  const button = document.createElement('button');
  button.className = 'mobile-menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-label', 'Open navigation');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '&#9776;';
  if (cartToggle) {
    header.insertBefore(button, cartToggle);
  } else {
    header.appendChild(button);
  }

  button.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('mobile-nav-open');
    button.classList.toggle('menu-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    button.innerHTML = isOpen ? '&times;' : '&#9776;';
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('mobile-nav-open');
      button.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Open navigation');
      button.innerHTML = '&#9776;';
    });
  });

  const syncMenuState = () => {
    if (window.innerWidth > 768) {
      nav.classList.remove('mobile-nav-open');
      button.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Open navigation');
      button.innerHTML = '&#9776;';
    }
  };

  window.addEventListener('resize', syncMenuState);
  syncMenuState();
}

function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.product-card, .category-card').forEach((card) => card.classList.add('fade-in'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('fade-in');
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  document.querySelectorAll('.product-card, .category-card').forEach((card) => observer.observe(card));
}

function updateCheckoutSummary() {
  const orderItems = document.getElementById('orderItems');
  if (!orderItems || !window.cart) {
    return;
  }

  const subtotalElement = document.getElementById('subtotalAmount');
  const discountRow = document.getElementById('discountRow');
  const discountAmount = document.getElementById('discountAmount');
  const totalElement = document.getElementById('totalAmount');
  const placeOrderButton = document.querySelector('.place-order-btn');
  const discountInput = document.getElementById('colorGuess');
  const shipping = 2500;
  const subtotal = window.cart.getSubtotal();
  const discountEligible = discountInput?.value?.trim().toLowerCase() === 'khaki';
  const discount = discountEligible ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount;

  if (!window.cart.items.length) {
    orderItems.innerHTML = '<p class="cart-empty">Your cart is empty. Add a product before checking out.</p>';
    subtotalElement.textContent = formatPrice(0);
    totalElement.textContent = formatPrice(0);
    discountRow.classList.add('hidden');
    placeOrderButton.disabled = true;
    return;
  }

  orderItems.innerHTML = window.cart.items.map((item, index) => `
    <div class="order-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--grey-light); padding-bottom: 1.5rem;">
      <img src="${item.image}" alt="${escapeHtml(item.description)}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
        <div class="order-item-summary" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
          <span class="order-item-title" style="font-size: 0.95rem; font-weight: 500; line-height: 1.4;">${escapeHtml(item.description)} <br><span style="color: var(--grey-mid); font-size: 0.85rem;">Size: ${escapeHtml(item.size)}</span></span>
          <span class="order-item-price" style="font-weight: 600; font-size: 0.95rem;">${formatPrice(item.price * item.quantity)}</span>
        </div>
        <div class="order-item-actions" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
          <button type="button" class="order-item-btn order-item-decrease" data-index="${index}" aria-label="Decrease quantity" style="width: 28px; height: 28px; border: 1px solid var(--grey-mid); background: transparent; border-radius: 4px; cursor: pointer;">-</button>
          <span class="order-item-qty" style="font-size: 0.9rem; font-weight: 600; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button type="button" class="order-item-btn order-item-increase" data-index="${index}" aria-label="Increase quantity" style="width: 28px; height: 28px; border: 1px solid var(--grey-mid); background: transparent; border-radius: 4px; cursor: pointer;">+</button>
          <button type="button" class="order-item-remove" data-index="${index}" aria-label="Remove item" style="margin-left: 0.5rem; color: var(--grey-mid); background: transparent; border: 1px solid var(--grey-light); width: 28px; height: 28px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');

  subtotalElement.textContent = formatPrice(subtotal);
  totalElement.textContent = formatPrice(total);
  placeOrderButton.disabled = false;

  if (discountEligible) {
    discountRow.classList.remove('hidden');
    discountAmount.textContent = `-${formatPrice(discount)}`;
  } else {
    discountRow.classList.add('hidden');
  }
}

function initCheckout() {
  const form = document.getElementById('checkoutForm');
  if (!form) {
    return;
  }

  const orderItems = document.getElementById('orderItems');
  const discountInput = document.getElementById('colorGuess');
  discountInput?.addEventListener('input', updateCheckoutSummary);

  const deliverySelect = document.getElementById('deliveryMethod');
  if (deliverySelect) {
    deliverySelect.addEventListener('invalid', (event) => {
      event.preventDefault();
      deliverySelect.setCustomValidity('Please pick a delivery option before placing your order.');
    });
    deliverySelect.addEventListener('input', () => {
      deliverySelect.setCustomValidity('');
    });
    deliverySelect.addEventListener('change', () => {
      deliverySelect.setCustomValidity('');
    });
  }

  orderItems?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
      return;
    }

    const index = Number(button.dataset.index);
    if (button.classList.contains('order-item-decrease')) {
      window.cart.changeQuantity(index, -1);
      return;
    }

    if (button.classList.contains('order-item-increase')) {
      window.cart.changeQuantity(index, 1);
      return;
    }

    if (button.classList.contains('order-item-remove')) {
      window.cart.removeItem(index);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!window.cart.items.length) {
      showToast('Add products to your cart before checking out.');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const orderTotal = window.cart.getSubtotal() + 2500 - (discountInput.value.trim().toLowerCase() === 'khaki' ? Math.round(window.cart.getSubtotal() * 0.1) : 0);
    const orderRecord = {
      id: `VC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer: data,
      items: window.cart.items,
      total: orderTotal
    };

    const savedOrders = getStoredJson(STORAGE_KEYS.orders, []);
    savedOrders.unshift(orderRecord);
    setStoredJson(STORAGE_KEYS.orders, savedOrders);
    window.cart.clear();
    updateCheckoutSummary();
    form.reset();
    showToast(`Order ${orderRecord.id} placed successfully.`);

    window.setTimeout(() => {
      window.location.href = 'index.html';
    }, 1800);
  });

  updateCheckoutSummary();
}

function initInlineForms() {
  document.querySelectorAll('.newsletter-form, .contact-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      form.reset();
      showToast('Thanks. We saved your details locally for now.');
    });
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeProductModal();
    window.cart?.close();
  }
});

function initThemeToggle() {
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', 'Toggle Dark Mode');
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun fa-lg"></i>' : '<i class="fas fa-moon fa-lg"></i>';
  
  const header = document.querySelector('header');
  const cartToggle = document.querySelector('.cart-toggle');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  
  if (header && cartToggle) {
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'header-actions';
    actionsWrap.style.display = 'flex';
    actionsWrap.style.alignItems = 'center';
    actionsWrap.style.gap = '1rem';
    
    header.insertBefore(actionsWrap, mobileToggle || cartToggle);
    
    if (mobileToggle) actionsWrap.appendChild(mobileToggle);
    actionsWrap.appendChild(cartToggle);
    actionsWrap.appendChild(themeToggle);
  }

  themeToggle.addEventListener('click', () => {
    const currentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (currentlyDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('verveTheme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon fa-lg"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('verveTheme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun fa-lg"></i>';
    }
  });
}

function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

function initPageTransitions() {
  // Page load transition
  document.body.classList.add('page-transitioning');
  window.requestAnimationFrame(() => {
    document.body.classList.remove('page-transitioning');
  });

  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (link && link.href && link.hostname === window.location.hostname && !link.hash && link.target !== '_blank') {
      e.preventDefault();
      document.body.classList.add('page-transitioning');
      setTimeout(() => {
        window.location.href = link.href;
      }, 300);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ensureCartShell();
  window.cart = new ShoppingCart();
  window.cart.bindEvents();
  window.cart.render();

  hydrateProducts();
  bindProductCards();
  applyHeroImages();
  initMobileNav();
  initScrollAnimations();
  initInlineForms();
  initCheckout();
  initThemeToggle();
  initHeaderScroll();
  initPageTransitions();

  const cards = [...document.querySelectorAll('.products-grid .product-card')];
  if (cards.length) {
    new CatalogView(cards).init();
  }
});
