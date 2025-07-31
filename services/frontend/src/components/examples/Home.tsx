import { useCallback } from "../../hooks/useCallback";
import { useEffect } from "../../hooks/useEffect";
import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from '../../vdom/createElement';

import { CounterExample } from "./Counter";

export const Home = () => {
  return (
  //  <input type="text" placeholder="Search..." className="search-input"  onclick={() => console.log("Search clicked")} />
  <CounterExample />
);
};