import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let isRegistered = false;

export default function usePublicGsap(rootRef) {
  useEffect(() => {
    if (!rootRef?.current || typeof window === 'undefined') {
      return undefined;
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
              start: 'top 94%',
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

    return () => {
      ctx.revert();
    };
  }, [rootRef]);
}
