/**
 * AnimatedOutlet: wraps TanStack Router's Outlet with motion transitions.
 *
 * Preserves stale router context for exiting routes so AnimatePresence
 * can finish the exit animation before the old content unmounts.
 *
 * Enter: fade + 8px slide-up over 200ms
 * Exit: fade-only over 150ms
 */
import { useContext, useRef } from 'react';
import { Outlet, getRouterContext } from '@tanstack/react-router';
import { motion, useIsPresent } from 'motion/react';

const RouterContext = getRouterContext();

export function AnimatedOutlet() {
  const routerContext = useContext(RouterContext);
  const renderedContext = useRef(routerContext);
  const isPresent = useIsPresent();

  // When entering/visible, update to fresh context.
  // When exiting, keep stale ref so the old route still renders correctly.
  // Object.assign preserves the prototype chain (AnyRouter has methods that
  // a plain spread would lose), creating a shallow snapshot of enumerable props.
  if (isPresent) {
    renderedContext.current = Object.assign(
      Object.create(Object.getPrototypeOf(routerContext)),
      routerContext
    ) as typeof routerContext;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] } }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-1 flex-col [&>*]:w-full"
    >
      <RouterContext.Provider value={renderedContext.current}>
        <Outlet />
      </RouterContext.Provider>
    </motion.div>
  );
}
