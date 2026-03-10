import React, { useContext, useEffect, useRef } from 'react';
import { ScrollContext } from '../ScrollContext';
import { SectionContext } from '../context/SectionContext';

interface SectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  index: number;
  noSnap?: boolean;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, children, className, index, noSnap = false }) => {
  const { setCurrentSectionIndex, setActiveSectionId } = useContext(ScrollContext);
  const { currentSectionIndex } = useContext(ScrollContext);
  const isActive = currentSectionIndex === index;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCurrentSectionIndex(index);
          setActiveSectionId(id);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [index, id, setCurrentSectionIndex, setActiveSectionId]);

  // Recursively add isActive prop to specific components (legacy support)
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const componentName = (child.type as any).displayName || (child.type as any).name;
      if (['Hero', 'Reveal', 'ScrollReveal', 'ServicesGrid', 'TrustSection', 'LocationSection', 'FinalCTA', 'VoicesOfJos', 'WaterDeepDive', 'MarketDeepDive', 'BakeryDeepDive', 'DiningDeepDive', 'LoungeDeepDive', 'GamesDeepDive'].includes(componentName)) {
        return React.cloneElement(child, { isActive } as any);
      }
    }
    return child;
  });

  return (
    <SectionContext.Provider value={{ index, isActive }}>
      <div 
        ref={ref}
        id={id} 
        className={`${noSnap ? '' : 'snap-start'} cinematic-section ${className}`}
      >
        {childrenWithProps}
      </div>
    </SectionContext.Provider>
  );
};
