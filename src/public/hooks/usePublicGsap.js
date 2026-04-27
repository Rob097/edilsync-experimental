import { useEffect } from 'react';

let isRegistered = false;

export default function usePublicGsap(rootRef) {
  useEffect(() => {
    if (!rootRef?.current || typeof window === 'undefined') {
      return undefined;
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const skipAnimations = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(pointer: coarse)').matches
      || connection?.saveData;

    if (skipAnimations) {
      return undefined;
    }
    let isCancelled = false;
    let idleId = null;
    let fallbackTimer = null;
    let teardown = () => {};

    const startAnimations = async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (isCancelled || !rootRef.current) {
        return;
      }

      if (!isRegistered) {
        gsap.registerPlugin(ScrollTrigger);
        isRegistered = true;
      }

      const ctx = gsap.context(() => {
        const revealTargets = gsap.utils.toArray('[data-reveal]');
        revealTargets.forEach((node) => {
          gsap.fromTo(
            node,
            { autoAlpha: 0, y: 26 },
            {
              autoAlpha: 1,
              y: 0,
              ease: 'power2.out',
              duration: 0.55,
              delay: 0,
              scrollTrigger: {
                trigger: node,
                start: 'top bottom-=24',
                fastScrollEnd: true,
                invalidateOnRefresh: true,
                once: true,
              },
            },
          );
        });

        gsap.utils.toArray('[data-parallax]').forEach((node) => {
          const speed = node.getAttribute('data-parallax');
          const distance = speed === 'medium' ? 56 : 34;

          gsap.fromTo(
            node,
            { y: -distance * 0.35 },
            {
              y: distance,
              ease: 'none',
              scrollTrigger: {
                trigger: node.closest('section') || node,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
        });

        gsap.utils.toArray('[data-price-card]').forEach((node) => {
          gsap.fromTo(
            node,
            { y: 36, scale: 0.96, autoAlpha: 0.9 },
            {
              y: 0,
              scale: 1,
              autoAlpha: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: node,
                start: 'top 85%',
                end: 'top 35%',
                scrub: 0.8,
              },
            },
          );
        });

        gsap.to('[data-float="left"]', {
          x: -14,
          y: 12,
          duration: 6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        gsap.to('[data-float="right"]', {
          x: 12,
          y: -10,
          duration: 5.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }, rootRef);

      const refresh = () => ScrollTrigger.refresh();
      let refreshTimer = null;
      const refreshSoon = () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(refresh, 90);
      };

      const trackedImages = rootRef.current.querySelectorAll('img');
      trackedImages.forEach((img) => {
        if (!img.complete) {
          img.addEventListener('load', refreshSoon);
        }
      });

      window.addEventListener('load', refreshSoon);
      window.addEventListener('resize', refreshSoon);
      window.addEventListener('orientationchange', refreshSoon);

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refreshSoon();
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);

      refreshSoon();

      teardown = () => {
        window.clearTimeout(refreshTimer);
        trackedImages.forEach((img) => {
          img.removeEventListener('load', refreshSoon);
        });
        window.removeEventListener('load', refreshSoon);
        window.removeEventListener('resize', refreshSoon);
        window.removeEventListener('orientationchange', refreshSoon);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        ctx.revert();
      };
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => {
        startAnimations();
      }, { timeout: 1200 });
    } else {
      fallbackTimer = window.setTimeout(() => {
        startAnimations();
      }, 180);
    }

    return () => {
      isCancelled = true;
      if (idleId !== null) {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(fallbackTimer);
      teardown();
    };
  }, [rootRef]);
}
