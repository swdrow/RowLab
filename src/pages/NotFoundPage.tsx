import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * NotFoundPage - Custom 404 page with rowing theme
 * Displays when users navigate to invalid routes
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light-bg via-white to-light-bg dark:from-dark-bg dark:via-dark-card dark:to-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          🚣
        </motion.div>
        
        <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
        
        <p className="text-text-secondary mb-6">
          Looks like you've rowed off course! The page you're looking for doesn't exist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blade-blue text-white rounded-lg hover:bg-blade-blue/90 transition-colors"
          >
            <Home size={18} />
            <span>Back to Dashboard</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-dark-card text-text-primary border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
