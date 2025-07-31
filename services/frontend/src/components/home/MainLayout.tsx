import { Sidebar } from './Sidebar';
import { Content } from './Content';
import { ChatPanel } from './ChatPanel';
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";

export const MainLayout: ComponentFunction = () => {
  return (
    <main className="flex h-[calc(100vh-72px)] text-white">
      <Sidebar />
      <Content />
      <ChatPanel />
    </main>
  )
}
