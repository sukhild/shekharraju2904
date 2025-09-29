
import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md' }) => {
  const getInitials = (nameStr: string) => {
    if (!nameStr) return '';
    const names = nameStr.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold ${sizeClasses[size]}`}>
      <span className="leading-none">{getInitials(name)}</span>
    </span>
  );
};

export default Avatar;
