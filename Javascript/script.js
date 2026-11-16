// ===============================
// SOLÉA – script.js (JavaScript natif)
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Collecte des éléments et données produits
    const productCards = document.querySelectorAll(".product-card");
    const featuredAddButton = document.querySelector('[data-js="add-featured-to-cart"]');

    const parsePrice = (text) => {
        if (!text) return 0;
        const cleaned = text.replace(/[^\d,.-]/g, "").replace(",", ".");
        const value = Number.parseFloat(cleaned);
        return Number.isNaN(value) ? 0 : value;
    };

    const products = [];
    productCards.forEach((card) => {
        const id = card.getAttribute("data-product-id");
        const nameEl = card.querySelector(".product-name");
        const priceEl = card.querySelector(".product-price");
        const imgEl = card.querySelector(".product-image");
        const spfEl = card.querySelector(".product-spf");

        if (!id || !nameEl || !priceEl || !imgEl) return;

        products.push({
            id,
            name: nameEl.textContent.trim(),
            price: parsePrice(priceEl.textContent),
            image: imgEl.getAttribute("src"),
            spf: spfEl ? spfEl.textContent.trim() : ""
        });
    });

    let featuredProduct = products.find(
        (p) => p.name.toLowerCase().includes("fluide solaire invisible")
    );
    if (!featuredProduct) {
        featuredProduct = {
            id: "featured",
            name: "Fluide Solaire Invisible SPF 50+ – Édition Été",
            price: 29.9,
            image: "IMG4.jpg",
            spf: "SPF 50+"
        };
    }

    // 2. État du panier & favoris
    let cart = [];
    let favorites = [];

    const CART_STORAGE_KEY = "solea_cart";
    const FAVORITES_STORAGE_KEY = "solea_favorites";

    const cartCountEl = document.querySelector('[data-js="cart-count"]');
    const cartToggleButton = document.querySelector('[data-js="cart-toggle"]');

    // 3. LocalStorage helpers
    const loadCartFromStorage = () => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            cart = stored ? JSON.parse(stored) : [];
        } catch {
            cart = [];
        }
    };

    const saveCartToStorage = () => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch {
            // ignore
        }
    };

    const loadFavoritesFromStorage = () => {
        try {
            const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
            favorites = stored ? JSON.parse(stored) : [];
        } catch {
            favorites = [];
        }
    };

    const saveFavoritesToStorage = () => {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        } catch {
            // ignore
        }
    };

    // 4. Notifications simples
    let notificationContainer = null;

    const ensureNotificationContainer = () => {
        if (notificationContainer) return;
        notificationContainer = document.createElement("div");
        notificationContainer.style.position = "fixed";
        notificationContainer.style.top = "1rem";
        notificationContainer.style.right = "1rem";
        notificationContainer.style.zIndex = "999";
        notificationContainer.style.display = "flex";
        notificationContainer.style.flexDirection = "column";
        notificationContainer.style.gap = "0.5rem";
        document.body.appendChild(notificationContainer);
    };

    const showNotification = (message, type = "info") => {
        ensureNotificationContainer();
        const notif = document.createElement("div");
        notif.textContent = message;
        notif.style.padding = "0.6rem 0.9rem";
        notif.style.borderRadius = "999px";
        notif.style.fontSize = "0.85rem";
        notif.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
        if (type === "success") {
            notif.style.backgroundColor = "#3a7fa6";
            notif.style.color = "#fff";
        } else if (type === "error") {
            notif.style.backgroundColor = "#f6b94b";
            notif.style.color = "#2f2a24";
        } else {
            notif.style.backgroundColor = "#ffffff";
            notif.style.color = "#2f2a24";
        }

        notificationContainer.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = "0";
            notif.style.transition = "opacity 200ms ease-out";
            setTimeout(() => {
                notif.remove();
            }, 220);
        }, 2200);
    };

    // 5. Interface panier (drawer)
    let cartOverlay = null;
    let cartDrawer = null;

    const formatPrice = (value) => `${value.toFixed(2).replace(".", ",")} €`;

    const createCartUI = () => {
        if (cartOverlay && cartDrawer) return;

        cartOverlay = document.createElement("div");
        cartOverlay.style.position = "fixed";
        cartOverlay.style.top = "0";
        cartOverlay.style.left = "0";
        cartOverlay.style.right = "0";
        cartOverlay.style.bottom = "0";
        cartOverlay.style.backgroundColor = "rgba(0,0,0,0.25)";
        cartOverlay.style.zIndex = "998";
        cartOverlay.style.opacity = "0";
        cartOverlay.style.pointerEvents = "none";
        cartOverlay.style.transition = "opacity 220ms ease-out";

        cartDrawer = document.createElement("aside");
        cartDrawer.setAttribute("aria-label", "Panier SOLÉA");
        cartDrawer.style.position = "fixed";
        cartDrawer.style.top = "0";
        cartDrawer.style.right = "0";
        cartDrawer.style.width = "360px";
        cartDrawer.style.maxWidth = "100%";
        cartDrawer.style.height = "100%";
        cartDrawer.style.backgroundColor = "#fdfaf6";
        cartDrawer.style.boxShadow = "0 0 30px rgba(0,0,0,0.18)";
        cartDrawer.style.zIndex = "999";
        cartDrawer.style.transform = "translateX(100%)";
        cartDrawer.style.transition = "transform 220ms ease-out";
        cartDrawer.style.display = "flex";
        cartDrawer.style.flexDirection = "column";

        const header = document.createElement("div");
        header.style.padding = "1rem 1.2rem";
        header.style.borderBottom = "1px solid #e2d7c8";
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";

        const title = document.createElement("h2");
        title.textContent = "Votre panier";
        title.style.fontSize = "1.1rem";
        title.style.margin = "0";

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.textContent = "✕";
        closeBtn.style.border = "none";
        closeBtn.style.background = "none";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "1.1rem";

        closeBtn.addEventListener("click", () => {
            closeCartDrawer();
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        const content = document.createElement("div");
        content.style.flex = "1";
        content.style.overflowY = "auto";
        content.style.padding = "0.8rem 1.2rem";
        content.setAttribute("data-js", "cart-content");

        const footer = document.createElement("div");
        footer.style.padding = "0.9rem 1.2rem";
        footer.style.borderTop = "1px solid #e2d7c8";
        footer.style.display = "flex";
        footer.style.flexDirection = "column";
        footer.style.gap = "0.4rem";

        const totalRow = document.createElement("div");
        totalRow.style.display = "flex";
        totalRow.style.justifyContent = "space-between";
        totalRow.style.alignItems = "center";

        const totalLabel = document.createElement("span");
        totalLabel.textContent = "Total";
        totalLabel.style.fontWeight = "600";

        const totalValue = document.createElement("span");
        totalValue.setAttribute("data-js", "cart-total");
        totalValue.textContent = formatPrice(0);
        totalValue.style.fontWeight = "600";

        totalRow.appendChild(totalLabel);
        totalRow.appendChild(totalValue);

        const checkoutHint = document.createElement("p");
        checkoutHint.textContent =
            "Ce site est une démonstration. Le paiement n'est pas activé.";
        checkoutHint.style.fontSize = "0.8rem";
        checkoutHint.style.color = "#7a6f63";
        checkoutHint.style.margin = "0";

        footer.appendChild(totalRow);
        footer.appendChild(checkoutHint);

        cartDrawer.appendChild(header);
        cartDrawer.appendChild(content);
        cartDrawer.appendChild(footer);

        document.body.appendChild(cartOverlay);
        document.body.appendChild(cartDrawer);

        cartOverlay.addEventListener("click", () => {
            closeCartDrawer();
        });
    };

    const openCartDrawer = () => {
        createCartUI();
        cartOverlay.style.opacity = "1";
        cartOverlay.style.pointerEvents = "auto";
        cartDrawer.style.transform = "translateX(0)";
        document.body.style.overflow = "hidden";
    };

    const closeCartDrawer = () => {
        if (!cartOverlay || !cartDrawer) return;
        cartOverlay.style.opacity = "0";
        cartOverlay.style.pointerEvents = "none";
        cartDrawer.style.transform = "translateX(100%)";
        document.body.style.overflow = "";
    };

    const updateCartCount = () => {
        if (!cartCountEl) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = String(totalItems);
    };

    const renderCart = () => {
        createCartUI();
        const content = cartDrawer.querySelector('[data-js="cart-content"]');
        const totalEl = cartDrawer.querySelector('[data-js="cart-total"]');
        if (!content || !totalEl) return;

        content.innerHTML = "";

        if (cart.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.textContent = "Votre panier est vide.";
            emptyMsg.style.fontSize = "0.9rem";
            emptyMsg.style.color = "#7a6f63";
            content.appendChild(emptyMsg);
            totalEl.textContent = formatPrice(0);
            return;
        }

        let total = 0;

        content.onclick = null;

        cart.forEach((item) => {
            const row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "60px minmax(0, 1fr)";
            row.style.gap = "0.6rem";
            row.style.marginBottom = "0.8rem";
            row.style.alignItems = "center";

            const img = document.createElement("img");
            img.src = item.image;
            img.alt = item.name;
            img.style.width = "60px";
            img.style.height = "60px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "8px";

            const info = document.createElement("div");
            info.style.display = "flex";
            info.style.flexDirection = "column";
            info.style.gap = "0.25rem";

            const name = document.createElement("div");
            name.textContent = item.name;
            name.style.fontSize = "0.9rem";
            name.style.fontWeight = "500";

            const priceRow = document.createElement("div");
            priceRow.style.display = "flex";
            priceRow.style.justifyContent = "space-between";
            priceRow.style.alignItems = "center";

            const unitPrice = document.createElement("span");
            unitPrice.textContent = formatPrice(item.price);
            unitPrice.style.fontSize = "0.85rem";

            const quantityControls = document.createElement("div");
            quantityControls.style.display = "flex";
            quantityControls.style.alignItems = "center";
            quantityControls.style.gap = "0.3rem";

            const minusBtn = document.createElement("button");
            minusBtn.type = "button";
            minusBtn.textContent = "−";
            minusBtn.style.border = "1px solid #e2d7c8";
            minusBtn.style.borderRadius = "999px";
            minusBtn.style.width = "24px";
            minusBtn.style.height = "24px";
            minusBtn.style.cursor = "pointer";
            minusBtn.dataset.id = item.id;

            const qty = document.createElement("span");
            qty.textContent = String(item.quantity);
            qty.style.fontSize = "0.85rem";

            const plusBtn = document.createElement("button");
            plusBtn.type = "button";
            plusBtn.textContent = "+";
            plusBtn.style.border = "1px solid #e2d7c8";
            plusBtn.style.borderRadius = "999px";
            plusBtn.style.width = "24px";
            plusBtn.style.height = "24px";
            plusBtn.style.cursor = "pointer";
            plusBtn.dataset.id = item.id;

            quantityControls.appendChild(minusBtn);
            quantityControls.appendChild(qty);
            quantityControls.appendChild(plusBtn);

            priceRow.appendChild(unitPrice);
            priceRow.appendChild(quantityControls);

            const subtotalRow = document.createElement("div");
            subtotalRow.style.display = "flex";
            subtotalRow.style.justifyContent = "space-between";
            subtotalRow.style.alignItems = "center";

            const subtotalLabel = document.createElement("span");
            subtotalLabel.textContent = "Sous-total";
            subtotalLabel.style.fontSize = "0.8rem";
            subtotalLabel.style.color = "#7a6f63";

            const subtotalValue = document.createElement("span");
            const subtotal = item.price * item.quantity;
            subtotalValue.textContent = formatPrice(subtotal);
            subtotalValue.style.fontSize = "0.85rem";
            subtotalValue.style.fontWeight = "500";

            subtotalRow.appendChild(subtotalLabel);
            subtotalRow.appendChild(subtotalValue);

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "Supprimer";
            removeBtn.style.border = "none";
            removeBtn.style.background = "none";
            removeBtn.style.color = "#3a7fa6";
            removeBtn.style.fontSize = "0.8rem";
            removeBtn.style.cursor = "pointer";
            removeBtn.style.alignSelf = "flex-start";
            removeBtn.dataset.id = item.id;

            info.appendChild(name);
            info.appendChild(priceRow);
            info.appendChild(subtotalRow);
            info.appendChild(removeBtn);

            row.appendChild(img);
            row.appendChild(info);

            content.appendChild(row);

            total += subtotal;
        });

        totalEl.textContent = formatPrice(total);

        content.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const id = target.dataset.id;
            if (!id) return;

            if (target.textContent === "+") {
                changeQuantity(id, 1);
            } else if (target.textContent === "−") {
                changeQuantity(id, -1);
            } else if (target.textContent === "Supprimer") {
                removeFromCart(id);
            }
        });
    };

    // 6. Ajout / suppression / quantités
    const findProductById = (id) => products.find((p) => p.id === id);

    const addToCart = (productId) => {
        const product =
            findProductById(productId) ||
            (productId === featuredProduct.id ? featuredProduct : null);
        if (!product) return;

        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        saveCartToStorage();
        updateCartCount();
        renderCart();
        showNotification("Produit ajouté au panier ✓", "success");
    };

    const removeFromCart = (productId) => {
        cart = cart.filter((item) => item.id !== productId);
        saveCartToStorage();
        updateCartCount();
        renderCart();
        showNotification("Produit supprimé du panier", "info");
    };

    const changeQuantity = (productId, delta) => {
        const item = cart.find((i) => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter((i) => i.id !== productId);
            showNotification("Produit supprimé du panier", "info");
        } else {
            showNotification("Quantité mise à jour", "success");
        }

        saveCartToStorage();
        updateCartCount();
        renderCart();
    };

    // 7. Favoris
    const isFavorite = (productId) => favorites.includes(productId);

    const toggleFavorite = (productId, buttonEl) => {
        if (!productId) return;

        if (isFavorite(productId)) {
            favorites = favorites.filter((id) => id !== productId);
            showNotification("Retiré des favoris", "info");
        } else {
            favorites.push(productId);
            showNotification("Ajouté aux favoris ♡", "success");
        }

        saveFavoritesToStorage();

        if (buttonEl) {
            const icon = buttonEl.querySelector(".icon-heart");
            if (icon) {
                icon.style.borderColor = isFavorite(productId)
                    ? "#f6b94b"
                    : "#7a6f63";
            }
        }
    };

    const initFavoritesUI = () => {
        const favoriteButtons = document.querySelectorAll('[data-js="toggle-favorite"]');
        favoriteButtons.forEach((btn) => {
            const card = btn.closest(".product-card");
            if (!card) return;
            const id = card.getAttribute("data-product-id");
            if (!id) return;

            const icon = btn.querySelector(".icon-heart");
            if (icon) {
                icon.style.borderColor = isFavorite(id) ? "#f6b94b" : "#7a6f63";
            }

            btn.addEventListener("click", () => {
                toggleFavorite(id, btn);
            });
        });
    };

    // 8. Recherche
    const searchBar = document.querySelector('[data-js="search-bar"]');
    const searchToggleButton = document.querySelector('[data-js="search-toggle"]');
    const searchInput = document.querySelector("#search-input");

    let noResultsMessage = null;

    const ensureNoResultsMessage = () => {
        if (noResultsMessage) return;
        const productsSection = document.querySelector(".section-products");
        if (!productsSection) return;
        noResultsMessage = document.createElement("p");
        noResultsMessage.textContent = "Aucun produit trouvé.";
        noResultsMessage.style.fontSize = "0.9rem";
        noResultsMessage.style.color = "#7a6f63";
        noResultsMessage.style.marginTop = "0.5rem";
        noResultsMessage.style.display = "none";
        productsSection.appendChild(noResultsMessage);
    };

    const filterProducts = (query) => {
        ensureNoResultsMessage();
        const normalized = query.trim().toLowerCase();
        let visibleCount = 0;

        productCards.forEach((card) => {
            const nameEl = card.querySelector(".product-name");
            const spfEl = card.querySelector(".product-spf");
            const badgeEl = card.querySelector(".product-badge");

            const text =
                (nameEl ? nameEl.textContent : "") +
                " " +
                (spfEl ? spfEl.textContent : "") +
                " " +
                (badgeEl ? badgeEl.textContent : "");

            const match = text.toLowerCase().includes(normalized);

            card.style.display = match || !normalized ? "" : "none";
            if (match || !normalized) visibleCount++;
        });

        if (noResultsMessage) {
            noResultsMessage.style.display =
                visibleCount === 0 && normalized ? "block" : "none";
        }
    };

    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            const value = event.target.value;
            filterProducts(value);
        });
    }

    if (searchToggleButton && searchBar) {
        searchToggleButton.addEventListener("click", () => {
            const isHidden = searchBar.hasAttribute("hidden");
            if (isHidden) {
                searchBar.removeAttribute("hidden");
                if (searchInput) searchInput.focus();
            } else {
                searchBar.setAttribute("hidden", "hidden");
                filterProducts("");
                if (searchInput) searchInput.value = "";
            }
        });
    }

    // 9. Menu mobile
    const navToggle =
        document.querySelector('[data-js="nav-toggle"]') ||
        document.querySelector(".nav-toggle");
    const mainNav = document.querySelector(".main-nav");
    const navList = document.querySelector(".nav-list");

    const closeMenu = () => {
        if (!navToggle || !navList) return;
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    };

    const openMenu = () => {
        if (!navToggle || !navList) return;
        navToggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    };

    if (navToggle && navList && mainNav) {
        navToggle.addEventListener("click", () => {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            if (expanded) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        navList.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.classList.contains("nav-link")) {
                closeMenu();
            }
        });

        document.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            if (!expanded) return;

            const clickInsideNav =
                mainNav.contains(target) || navToggle.contains(target);
            if (!clickInsideNav) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });
    }

    // 10. Newsletter
    const newsletterForm = document.querySelector('[data-js="newsletter-form"]');
    const newsletterEmailInput = document.querySelector("#newsletter-email");

    const isValidEmail = (email) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    };

    if (newsletterForm && newsletterEmailInput) {
        newsletterForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = newsletterEmailInput.value.trim();

            if (!email || !isValidEmail(email)) {
                showNotification("Veuillez entrer une adresse e-mail valide.", "error");
                return;
            }

            showNotification(
                "Merci ! Vous êtes inscrit(e) à la newsletter SOLÉA.",
                "success"
            );
            newsletterEmailInput.value = "";
        });
    }

    // 11. Boutons produits
    const addToCartButtons = document.querySelectorAll('[data-js="add-to-cart"]');

    addToCartButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".product-card");
            if (!card) return;
            const id = card.getAttribute("data-product-id");
            if (!id) return;
            addToCart(id);
        });
    });

    if (featuredAddButton) {
        featuredAddButton.addEventListener("click", () => {
            addToCart(featuredProduct.id);
            openCartDrawer();
        });
    }

    if (cartToggleButton) {
        cartToggleButton.addEventListener("click", () => {
            openCartDrawer();
            renderCart();
        });
    }

    // 12. Défilement fluide (liens internes)
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;
            const targetEl = document.querySelector(href);
            if (!targetEl) return;

            event.preventDefault();
            targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    // 13. Header au scroll
    const siteHeader = document.querySelector(".site-header");

    if (siteHeader) {
        window.addEventListener("scroll", () => {
            const y = window.scrollY || window.pageYOffset;
            if (y > 10) {
                siteHeader.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            } else {
                siteHeader.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
            }
        });
    }

    // 14. Année dans le footer
    const yearEl = document.querySelector('[data-js="current-year"]');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    // 15. Initialisation
    const init = () => {
        loadCartFromStorage();
        loadFavoritesFromStorage();
        updateCartCount();
        createCartUI();
        renderCart();
        initFavoritesUI();
    };

    init();
});
