(function () {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.site-sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      sidebar.classList.toggle('is-open', !expanded);
    });

    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        sidebar.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const backToTopBtn = document.querySelector('.back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.querySelectorAll('.command-pill').forEach(function (button) {
    button.addEventListener('click', function () {
      const value = button.getAttribute('data-copy') || button.innerText.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(value);
      }
      button.classList.add('is-copied');
      window.setTimeout(function () {
        button.classList.remove('is-copied');
      }, 1200);
    });
  });

  // Interactive Button Click Ripple
  document.addEventListener('pointerdown', function (e) {
    const btn = e.target.closest('.button, .newsletter-form button, .contact-submit-btn, .back-to-top');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height) * 2.2;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', function () {
      ripple.remove();
    });
  });

  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      const url = (form.getAttribute('action') || '').trim();
      const nameInput = form.querySelector('input[name="name"]');
      const emailInput = form.querySelector('input[name="email"]');
      const messageInput = form.querySelector('textarea[name="message"]');
      const button = form.querySelector('button[type="submit"]');
      const label = button ? (button.querySelector('.btn-label') || button) : null;
      const statusEl = form.parentElement.querySelector('[data-contact-status]');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !email || !message) return;

      const setStatus = function (msg, isSuccess) {
        if (!statusEl) return;
        statusEl.innerHTML = msg;
        statusEl.className = 'contact-status is-visible ' + (isSuccess ? 'is-success' : 'is-error');
      };

      const clearStatus = function () {
        if (!statusEl) return;
        statusEl.textContent = '';
        statusEl.className = 'contact-status';
      };

      // If a real endpoint (e.g. GoDaddy form URL or Formspree) is configured
      if (url && url !== '#' && url !== window.location.href) {
        if (form.getAttribute('data-use-fetch') === 'true') {
          event.preventDefault();
          if (button) button.disabled = true;
          if (label) label.textContent = 'Sending...';
          clearStatus();

          window.fetch(url, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
          })
            .then(function (res) {
              if (button) button.disabled = false;
              if (res.ok) {
                if (label) label.textContent = 'Message sent';
                if (button) button.classList.add('is-submitted');
                setStatus('Thank you! Your message has been sent successfully.', true);
                form.reset();
              } else {
                if (label) label.textContent = 'Send message';
                setStatus('Could not send message. Please try again or email us directly.', false);
              }
            })
            .catch(function () {
              if (button) button.disabled = false;
              if (label) label.textContent = 'Send message';
              setStatus('Could not connect. Please check your network or try again.', false);
            });
          return;
        }
        return;
      }

      // Default client-side send simulation when no action URL has been set yet
      event.preventDefault();
      if (button) {
        button.disabled = true;
        if (label) label.textContent = 'Sending...';
      }
      clearStatus();

      window.setTimeout(function () {
        if (button) {
          button.disabled = false;
          button.classList.add('is-submitted');
        }
        if (label) label.textContent = 'Message sent';
        setStatus('Thank you! Your message has been received. We will get back to you shortly.', true);
        form.reset();
      }, 500);
    });
  });

  document.querySelectorAll('[data-newsletter-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const url = (form.getAttribute('action') || '').trim();
      const emailInput = form.querySelector('input[name="EMAIL"]') || form.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';
      const button = form.querySelector('button[type="submit"]');
      const label = button ? (button.querySelector('.btn-label') || button) : null;
      const statusEl = form.parentElement.querySelector('[data-newsletter-status]');

      if (!email) return;

      const setStatus = function (msg, isSuccess) {
        if (!statusEl) return;
        statusEl.innerHTML = msg;
        statusEl.className = 'newsletter-status is-visible ' + (isSuccess ? 'is-success' : 'is-error');
      };

      const clearStatus = function () {
        if (!statusEl) return;
        statusEl.textContent = '';
        statusEl.className = 'newsletter-status';
      };

      // If no Mailchimp action URL is set yet, provide clean frontend confirmation
      if (!url || url === '#' || url === window.location.href) {
        if (button) {
          if (label) label.textContent = 'Subscribed';
          button.classList.add('is-subscribed');
        }
        setStatus('Thanks for subscribing! Check your inbox to confirm.', true);
        form.reset();
        return;
      }

      // Substack URL support: open Substack with pre-filled email
      if (url.includes('substack.com')) {
        if (button) {
          if (label) label.textContent = 'Subscribed';
          button.classList.add('is-subscribed');
        }
        setStatus('Opening Substack to complete your subscription...', true);
        const cleanSubstackUrl = url.replace(/\/$/, '');
        const targetUrl = cleanSubstackUrl + (cleanSubstackUrl.includes('/subscribe') ? '' : '/subscribe') + '?email=' + encodeURIComponent(email);
        window.open(targetUrl, '_blank');
        form.reset();
        return;
      }

      // Real Mailchimp URL provided: perform asynchronous JSONP submission
      if (button) {
        button.disabled = true;
        if (label) label.textContent = 'Subscribing...';
      }
      clearStatus();

      let jsonpUrl = url.replace('/subscribe/post?', '/subscribe/post-json?').replace('/subscribe/post', '/subscribe/post-json');
      const callbackName = 'mc_callback_' + Math.random().toString(36).slice(2, 9);

      const params = new URLSearchParams();
      const formData = new FormData(form);
      for (const [k, v] of formData.entries()) {
        params.append(k, v);
      }
      if (!params.has('EMAIL')) {
        params.append('EMAIL', email);
      }
      params.append('c', callbackName);

      jsonpUrl += (jsonpUrl.includes('?') ? '&' : '?') + params.toString();

      const script = document.createElement('script');
      script.src = jsonpUrl;

      const cleanup = function () {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (button) button.disabled = false;
      };

      const timeoutId = window.setTimeout(function () {
        cleanup();
        if (label) label.textContent = 'Subscribe';
        setStatus('Connection timed out. Please try again.', false);
      }, 10000);

      window[callbackName] = function (data) {
        window.clearTimeout(timeoutId);
        cleanup();

        if (data && data.result === 'success') {
          if (label) label.textContent = 'Subscribed';
          if (button) button.classList.add('is-subscribed');
          setStatus('Almost finished... Please check your email to confirm your subscription.', true);
          form.reset();
        } else {
          if (label) label.textContent = 'Subscribe';
          let err = (data && data.msg) || 'Could not subscribe. Please try again.';
          err = err.replace(/^[0-9]+\s*-\s*/, '');
          setStatus(err, false);
        }
      };

      script.onerror = function () {
        window.clearTimeout(timeoutId);
        cleanup();
        if (label) label.textContent = 'Subscribe';
        setStatus('Could not connect to Mailchimp. Please check your network or form URL.', false);
      };

      document.head.appendChild(script);
    });
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.faq-list details').forEach(function (details) {
    const summary = details.querySelector('summary');
    const content = details.querySelector('div');

    if (!summary || !content || reducedMotion.matches) {
      return;
    }

    content.style.height = details.open ? 'auto' : '0px';
    content.style.opacity = details.open ? '1' : '0';
    content.style.transform = details.open ? 'translateY(0)' : 'translateY(-0.35rem)';

    summary.addEventListener('click', function (event) {
      event.preventDefault();

      if (details.open) {
        details.classList.add('is-closing');
        content.style.height = content.scrollHeight + 'px';
        void content.offsetHeight;
        window.requestAnimationFrame(function () {
          content.style.height = '0px';
          content.style.opacity = '0';
          content.style.transform = 'translateY(-0.35rem)';
        });

        window.setTimeout(function () {
          details.open = false;
          details.classList.remove('is-closing');
        }, 320);
        return;
      }

      details.open = true;
      content.style.height = '0px';
      content.style.opacity = '0';
      content.style.transform = 'translateY(-0.35rem)';
      void content.offsetHeight;

      window.requestAnimationFrame(function () {
        content.style.height = content.scrollHeight + 'px';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      });
    });

    content.addEventListener('transitionend', function (event) {
      if (event.propertyName === 'height' && details.open && !details.classList.contains('is-closing')) {
        content.style.height = 'auto';
      }
    });
  });

  const revealTargets = document.querySelectorAll('.reveal-on-scroll');

  if (revealTargets.length && !reducedMotion.matches && 'IntersectionObserver' in window) {
    revealTargets.forEach(function (target, index) {
      target.style.setProperty('--reveal-delay', Math.min(index % 6, 5) * 45 + 'ms');
    });

    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.12,
      }
    );

    revealTargets.forEach(function (target) {
      revealObserver.observe(target);
    });
  } else {
    revealTargets.forEach(function (target) {
      target.classList.add('is-revealed');
    });
  }

  const countdownElements = document.querySelectorAll('.offer-countdown, [data-countdown-deadline], [data-monthly-countdown]');

  if (countdownElements.length) {
    const pad = function (value) {
      return String(value).padStart(2, '0');
    };

    const updateMonthlyCountdown = function () {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Countdown to the end of the current month
      const deadline = new Date(year, month + 1, 1, 0, 0, 0, 0);
      const remainingMs = deadline.getTime() - now.getTime();
      const isActive = remainingMs > 0;

      countdownElements.forEach(function (countdown) {
        const labelTextNode = countdown.closest('.offer-counter')?.querySelector('[data-offer-label-text]');

        let daysNode = countdown.querySelector('[data-countdown-days]');
        let hoursNode = countdown.querySelector('[data-countdown-hours]');
        let secondsNode = countdown.querySelector('[data-countdown-seconds]');

        if (!daysNode || !hoursNode || !secondsNode) {
          countdown.innerHTML =
            '<span><strong data-countdown-days>00</strong>D</span>' +
            '<span>:</span>' +
            '<span><strong data-countdown-hours>00</strong>H</span>' +
            '<span>:</span>' +
            '<span><strong data-countdown-seconds>00</strong>S</span>';
          daysNode = countdown.querySelector('[data-countdown-days]');
          hoursNode = countdown.querySelector('[data-countdown-hours]');
          secondsNode = countdown.querySelector('[data-countdown-seconds]');
        }

        if (!isActive) {
          countdown.classList.add('is-ended');
          if (labelTextNode) {
            labelTextNode.textContent = 'OFFER ENDED';
          }
          daysNode.textContent = '00';
          hoursNode.textContent = '00';
          secondsNode.textContent = '00';
        } else {
          countdown.classList.remove('is-ended');
          if (labelTextNode) {
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            labelTextNode.textContent = months[month] + ' SLOTS CLOSE IN';
          }

          const totalSeconds = Math.floor(remainingMs / 1000);
          const days = Math.floor(totalSeconds / 86400);
          const hours = Math.floor((totalSeconds % 86400) / 3600);
          const seconds = totalSeconds % 60;

          daysNode.textContent = pad(days);
          hoursNode.textContent = pad(hours);
          secondsNode.textContent = pad(seconds);
        }
      });
    };

    updateMonthlyCountdown();
    window.setInterval(updateMonthlyCountdown, 1000);
  }

  const sectionLinks = Array.prototype.slice.call(document.querySelectorAll('.side-nav > .side-menu a[href*="#"]'));

  if (sectionLinks.length) {
    const getLinkHash = function (link) {
      try {
        const url = new URL(link.getAttribute('href'), window.location.href);
        return url.pathname === window.location.pathname ? url.hash : '';
      } catch (error) {
        return '';
      }
    };

    const navTargets = sectionLinks
      .map(function (link) {
        const hash = getLinkHash(link);
        return hash ? { link: link, section: document.querySelector(hash) } : null;
      })
      .filter(function (item) {
        return item && item.section;
      });

    const setActiveSection = function (id) {
      navTargets.forEach(function (item) {
        const isActive = item.section.id === id;
        item.link.classList.toggle('is-active', isActive);
        item.link.parentElement.classList.toggle('is-active', isActive);

        if (isActive) {
          item.link.setAttribute('aria-current', 'true');
        } else {
          item.link.removeAttribute('aria-current');
        }
      });
    };

    const updateActiveFromScroll = function () {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 30;
      if (isAtBottom && navTargets.length > 0) {
        setActiveSection(navTargets[navTargets.length - 1].section.id);
        return;
      }

      const focusLine = window.innerHeight * 0.38;
      const current = navTargets.reduce(function (active, item) {
        const rect = item.section.getBoundingClientRect();

        if (rect.top <= focusLine && rect.bottom > focusLine) {
          return item;
        }

        if (!active && rect.top <= focusLine) {
          return item;
        }

        return active;
      }, null);

      if (current) {
        setActiveSection(current.section.id);
      }
    };

    if ('IntersectionObserver' in window) {
      const navObserver = new IntersectionObserver(
        function () {
          updateActiveFromScroll();
        },
        {
          rootMargin: '-28% 0px -62% 0px',
          threshold: 0,
        }
      );

      navTargets.forEach(function (item) {
        navObserver.observe(item.section);
      });
    }

    window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
    window.addEventListener('resize', updateActiveFromScroll);
    updateActiveFromScroll();
  }

  document.querySelectorAll('.featured-project-grid').forEach(function (grid) {
    const cards = Array.prototype.slice.call(grid.querySelectorAll('.featured-project-card'));
    let active = 0;
    let timer = null;
    let cycleWidth = 0;
    let cycleStart = 0;
    let baseIndex = 0;
    let allCards = cards;

    if (cards.length < 2 || grid.dataset.infiniteProjects === 'true') {
      return;
    }

    grid.dataset.infiniteProjects = 'true';

    cards.slice().reverse().forEach(function (card) {
      const clone = card.cloneNode(true);
      clone.classList.remove('reveal-on-scroll');
      clone.classList.add('is-revealed');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button').forEach(function (focusable) {
        focusable.setAttribute('tabindex', '-1');
      });
      grid.insertBefore(clone, grid.firstChild);
    });

    cards.forEach(function (card) {
      const clone = card.cloneNode(true);
      clone.classList.remove('reveal-on-scroll');
      clone.classList.add('is-revealed');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button').forEach(function (focusable) {
        focusable.setAttribute('tabindex', '-1');
      });
      grid.appendChild(clone);
    });

    allCards = Array.prototype.slice.call(grid.querySelectorAll('.featured-project-card'));
    baseIndex = cards.length;

    const measureCycle = function () {
      cycleStart = allCards[baseIndex].offsetLeft;
      cycleWidth = allCards[baseIndex + cards.length].offsetLeft - cycleStart;
    };

    const scrollToCard = function (index) {
      const normalized = ((index % cards.length) + cards.length) % cards.length;
      active = normalized;
      const targetIndex = baseIndex + normalized;
      grid.scrollTo({
        left: allCards[targetIndex].offsetLeft,
        behavior: 'smooth',
      });
    };

    const start = function () {
      if (timer || reducedMotion.matches) {
        return;
      }

      timer = window.setInterval(function () {
        scrollToCard(active + 1);
      }, 1500);
    };

    const stop = function () {
      if (!timer) {
        return;
      }

      window.clearInterval(timer);
      timer = null;
    };

    grid.addEventListener('mouseenter', stop);
    grid.addEventListener('focusin', stop);
    grid.addEventListener('mouseleave', start);
    grid.addEventListener('focusout', start);
    grid.addEventListener('scroll', function () {
      if (cycleWidth && grid.scrollLeft >= cycleStart + cycleWidth) {
        grid.scrollLeft = grid.scrollLeft - cycleWidth;
      } else if (cycleWidth && grid.scrollLeft < cycleStart) {
        grid.scrollLeft = grid.scrollLeft + cycleWidth;
      }

      const nearest = allCards.reduce(function (best, card, index) {
        const distance = Math.abs(card.offsetLeft - grid.scrollLeft);
        return distance < best.distance ? { index: index, distance: distance } : best;
      }, { index: active, distance: Infinity });

      active = ((nearest.index - baseIndex) % cards.length + cards.length) % cards.length;
    }, { passive: true });

    measureCycle();
    grid.scrollLeft = cycleStart;
    window.addEventListener('resize', function () {
      measureCycle();
      grid.scrollLeft = allCards[baseIndex + active].offsetLeft;
    });
    start();
  });

  document.querySelectorAll('[data-project-showreel]').forEach(function (reel) {
    const slides = Array.prototype.slice.call(reel.querySelectorAll('[data-showreel-slide]'));
    const dots = Array.prototype.slice.call(reel.querySelectorAll('[data-showreel-dot]'));
    const prev = reel.querySelector('[data-showreel-prev]');
    const next = reel.querySelector('[data-showreel-next]');
    let active = 0;
    let timer = null;

    if (slides.length < 2) {
      return;
    }

    const setActive = function (index) {
      active = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === active);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    };

    const stop = function () {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const start = function () {
      if (reducedMotion.matches || timer) {
        return;
      }

      timer = window.setInterval(function () {
        setActive(active + 1);
      }, 4200);
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        setActive(Number(dot.getAttribute('data-showreel-dot')) || 0);
        stop();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        setActive(active - 1);
        stop();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setActive(active + 1);
        stop();
      });
    }

    reel.addEventListener('mouseenter', stop);
    reel.addEventListener('focusin', stop);
    reel.addEventListener('mouseleave', start);
    start();
  });

  document.querySelectorAll('[data-chatbot]').forEach(function (chatbot) {
    const config = window.agenticAgencyChatbot || {};
    const toggleButton = chatbot.querySelector('[data-chatbot-toggle]');
    const closeButton = chatbot.querySelector('[data-chatbot-close]');
    const panel = chatbot.querySelector('[data-chatbot-panel]');
    const messages = chatbot.querySelector('[data-chatbot-messages]');
    const form = chatbot.querySelector('[data-chatbot-form]');
    const input = chatbot.querySelector('[data-chatbot-input]');
    const prompts = Array.prototype.slice.call(chatbot.querySelectorAll('[data-chatbot-prompt]'));
    let hasWelcome = false;

    if (!toggleButton || !panel || !messages || !form || !input || !config.endpoint) {
      return;
    }

    const addMessage = function (text, type) {
      const bubble = document.createElement('p');
      bubble.className = 'agency-chatbot-message agency-chatbot-message-' + type;
      bubble.textContent = text;
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    };

    const setOpen = function (open) {
      panel.hidden = !open;
      chatbot.classList.toggle('is-open', open);
      toggleButton.setAttribute('aria-expanded', String(open));

      if (open) {
        if (!hasWelcome) {
          addMessage(config.welcome || 'Ask me about the agency.', 'bot');
          hasWelcome = true;
        }

        window.setTimeout(function () {
          input.focus();
        }, 50);
      }
    };

    toggleButton.addEventListener('click', function () {
      setOpen(panel.hidden);
    });

    if (closeButton) {
      closeButton.addEventListener('click', function () {
        setOpen(false);
      });
    }

    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 112) + 'px';
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    prompts.forEach(function (prompt) {
      prompt.addEventListener('click', function () {
        input.value = prompt.getAttribute('data-chatbot-prompt') || prompt.textContent.trim();
        form.requestSubmit();
      });
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const value = input.value.trim();

      if (!value) {
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      addMessage(value, 'user');
      input.value = '';
      input.style.height = 'auto';
      input.disabled = true;

      if (submitButton) {
        submitButton.disabled = true;
      }

      const loading = addMessage('Thinking...', 'bot');

      try {
        const response = await window.fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': config.nonce || '',
          },
          body: JSON.stringify({ message: value }),
        });
        const data = await response.json();
        loading.textContent = data.message || config.error || 'I could not answer right now.';
      } catch (error) {
        loading.textContent = config.error || 'I could not answer right now.';
      } finally {
        input.disabled = false;

        if (submitButton) {
          submitButton.disabled = false;
        }

        input.focus();
      }
    });
  });
})();
