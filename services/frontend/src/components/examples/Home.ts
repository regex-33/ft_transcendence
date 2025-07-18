import { useCallback } from "../../hooks/useCallback";
import { useEffect } from "../../hooks/useEffect";
import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";


export const Home: ComponentFunction = () => {

  

  return h('div', { className: 'home-container' },
    h('h1', {}, 'Welcome to the Home Page'),
   h('p', {}, 'You are logged in!') 
  );
};