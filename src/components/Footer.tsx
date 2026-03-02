import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white py-2 px-4 z-10">
      <div className="text-center">
        <p className="text-sm">
          Powered by{' '}
          <span className="font-semibold text-blue-300">Brown Box Innovations</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
