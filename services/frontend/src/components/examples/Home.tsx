import { useCallback } from "../../hooks/useCallback";
import { useEffect } from "../../hooks/useEffect";
import { useState } from "../../hooks/useState";
import { ComponentFunction } from "../../types/global";
import { h } from '../../vdom/createElement';


export const Home = () => {
  return (
    <div className="home-container bg-red-300 ">
      <h1 className=" text-blue-700 hover:underline font-bold underline-offset-8 ">Welcome to the Home Page</h1>
      <p className="text-red-600">You are logged in as User</p>
    </div>
  );
};