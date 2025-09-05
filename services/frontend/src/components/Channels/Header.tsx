import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

const Header: ComponentFunction = () => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <h1 className="text-2xl font-bold text-white">Channels</h1>
      <div className="flex gap-4">
        <select className="px-3 py-2 rounded-lg bg-white/20 text-white">
          <option>Filter by</option>
          <option>Public</option>
          <option>Private</option>
        </select>
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300"
        />
      </div>
    </div>
  );
};

export default Header;
