/**
 * BNR Feedback Widget — feedback-widget.js
 *
 * Configuration (optional — set BEFORE the script runs):
 *   window.BNR_FEEDBACK_CONFIG = {
 *     endpoint: '/api/feedback',   // POST endpoint; omit to log to console only
 *     cooldownDays: 30,            // hide widget after feedback for N days (default 30)
 *     showDelayMs: 1500,           // ms delay before widget appears (default 1500)
 *   };
 */
(function () {
  'use strict';

  var cfg = window.BNR_FEEDBACK_CONFIG || {};
  var ENDPOINT      = cfg.endpoint     || null;
  var COOLDOWN_DAYS = cfg.cooldownDays != null ? cfg.cooldownDays : 30;
  var SHOW_DELAY_MS = cfg.showDelayMs  != null ? cfg.showDelayMs  : 1500;
  var STORAGE_KEY   = 'bnr_feedback_sent';

  /* ---------- Skip if already given feedback ---------- */
  function hasCooldown() {
    if (COOLDOWN_DAYS <= 0) return false;
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    var diff = (Date.now() - parseInt(stored, 10)) / (1000 * 60 * 60 * 24);
    return diff < COOLDOWN_DAYS;
  }

  function setCooldown() {
    if (COOLDOWN_DAYS > 0) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  }

  /* ---------- Send feedback ---------- */
  function sendFeedback(payload) {
    setCooldown();
    if (ENDPOINT) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(function () { /* non-blocking */ });
    } else {
      console.info('[BNR Feedback]', payload);
    }
  }

  /* ---------- DOM helpers ---------- */
  function showStep(widget, stepId) {
    var steps = widget.querySelectorAll('.bnr-step');
    steps.forEach(function (s) { s.hidden = true; });
    var target = widget.querySelector('#' + stepId);
    if (target) target.hidden = false;
  }

  function dismissWidget(widget) {
    widget.style.transition = 'opacity 0.3s, transform 0.3s';
    widget.style.opacity = '0';
    widget.style.transform = 'translateY(100%)';
    setTimeout(function () { widget.remove(); }, 350);
  }

  /* ---------- Build HTML ---------- */
  function buildWidget() {
    var div = document.createElement('div');
    div.id = 'bnr-feedback';
    div.setAttribute('role', 'region');
    div.setAttribute('aria-label', 'Feedback pagină');
    div.innerHTML = [
      '<div class="bnr-inner">',

        /* --- Step 1: Yes / No --- */
        '<div class="bnr-step" id="bnr-step-initial">',
          '<div class="bnr-icon" aria-hidden="true">',
            '<svg viewBox="0 0 24 24">',
              '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
            '</svg>',
          '</div>',
          '<span class="bnr-title">Ești mulțumit de această pagină?</span>',
          '<div class="bnr-actions" role="group" aria-label="Răspuns feedback">',
            '<button class="bnr-btn" id="bnr-btn-yes" tabindex="0">Da</button>',
            '<button class="bnr-btn" id="bnr-btn-no"  tabindex="0">Nu</button>',
          '</div>',
        '</div>',

        /* --- Step 2: Reasons --- */
        '<div class="bnr-step" id="bnr-step-reasons" hidden>',
          '<span class="bnr-title">Ce nu ți-a plăcut?</span>',
          '<div class="bnr-actions" role="group" aria-label="Motivul nemulțumirii">',
            '<button class="bnr-btn" data-reason="broken"  tabindex="0">Pagina nu funcționează</button>',
            '<button class="bnr-btn" data-reason="content" tabindex="0">Informația nu este folositoare</button>',
            '<button class="bnr-btn" data-reason="design"  tabindex="0">Designul nu este atractiv</button>',
            '<button class="bnr-btn" data-reason="other"   tabindex="0">Altceva</button>',
          '</div>',
        '</div>',

        /* --- Step 3: Free text (Altceva) --- */
        '<div class="bnr-step" id="bnr-step-other" hidden>',
          '<span class="bnr-title">Spune-ne mai multe:</span>',
          '<div class="bnr-textarea-wrap">',
            '<textarea id="bnr-other-text" rows="2" ',
              'placeholder="Descrie problema întâmpinată..." ',
              'maxlength="500" aria-label="Descriere problemă"></textarea>',
            '<button class="bnr-btn bnr-btn-send" id="bnr-btn-send" tabindex="0">Trimite</button>',
          '</div>',
        '</div>',

        /* --- Step 4: Thank you --- */
        '<div class="bnr-step" id="bnr-step-thanks" hidden>',
          '<span class="bnr-thanks">Mulțumim pentru feedback!</span>',
        '</div>',

        /* --- Close button --- */
        '<button class="bnr-close" id="bnr-btn-close" ',
          'aria-label="Închide widget feedback" title="Închide">&#x2715;</button>',

      '</div>',
    ].join('');
    return div;
  }

  /* ---------- Attach events ---------- */
  function attachEvents(widget) {
    /* Yes */
    widget.querySelector('#bnr-btn-yes').addEventListener('click', function () {
      sendFeedback({ page: location.href, answer: 'yes' });
      showStep(widget, 'bnr-step-thanks');
      setTimeout(function () { dismissWidget(widget); }, 2800);
    });

    /* No → reasons */
    widget.querySelector('#bnr-btn-no').addEventListener('click', function () {
      showStep(widget, 'bnr-step-reasons');
    });

    /* Reason buttons */
    widget.querySelectorAll('[data-reason]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reason = btn.getAttribute('data-reason');
        if (reason === 'other') {
          showStep(widget, 'bnr-step-other');
          widget.querySelector('#bnr-other-text').focus();
        } else {
          sendFeedback({ page: location.href, answer: 'no', reason: reason });
          showStep(widget, 'bnr-step-thanks');
          setTimeout(function () { dismissWidget(widget); }, 2800);
        }
      });
    });

    /* Send free text */
    widget.querySelector('#bnr-btn-send').addEventListener('click', function () {
      var text = widget.querySelector('#bnr-other-text').value.trim();
      sendFeedback({ page: location.href, answer: 'no', reason: 'other', detail: text });
      showStep(widget, 'bnr-step-thanks');
      setTimeout(function () { dismissWidget(widget); }, 2800);
    });

    /* Close */
    widget.querySelector('#bnr-btn-close').addEventListener('click', function () {
      dismissWidget(widget);
    });

    /* Keyboard: Enter / Space on buttons */
    widget.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('bnr-btn')) {
        e.preventDefault();
        e.target.click();
      }
    });
  }

  /* ---------- Init ---------- */
  function init() {
    if (hasCooldown()) return;
    var widget = buildWidget();
    widget.style.opacity = '0';
    widget.style.transform = 'translateY(20px)';
    widget.style.transition = 'opacity 0.35s, transform 0.35s';
    document.body.appendChild(widget);

    /* Slight delay before revealing */
    setTimeout(function () {
      widget.style.opacity = '1';
      widget.style.transform = 'translateY(0)';
    }, SHOW_DELAY_MS);

    attachEvents(widget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
