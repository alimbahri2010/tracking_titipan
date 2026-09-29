import React from 'react';
import defaultLogoImg from '../assets/images/regenerated_image_1790343140765.png';

interface TitipanLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'badge' | 'icon-only';
  inverted?: boolean;
  src?: string;
}

export const TitipanLogo: React.FC<TitipanLogoProps> = ({
  className = '',
  size = 'md',
  src,
}) => {
  const getDims = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-auto';
      case 'lg':
        return 'h-14 sm:h-16 w-auto';
      case 'xl':
        return 'h-20 w-auto';
      case 'md':
      default:
        return 'h-11 sm:h-12 w-auto';
    }
  };

  const px = getDims();

  return (
    <div className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src={src || defaultLogoImg}
        alt="Logo Titipan"
        style={{ borderStyle: 'none', borderRadius: '0px', borderColor: '#ffffff' }}
        className={`${px} max-w-[200px] object-contain rounded-none border-none`}
      />
    </div>
  );
};
