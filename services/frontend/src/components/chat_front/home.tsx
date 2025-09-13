import { Header } from './Header1';
export default function  Home (){

  return (
    <div
      className="relative flex flex-col overflow-hidden h-screen w-screen"
      style={{ backgroundColor: 'rgba(94, 156, 171, 0.9)' }}
      
    >
     <div
  className="absolute inset-0 z-0"
  style={{
    backgroundImage: 'url(/images/bg-home1.png)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  }}
/>

      
      <div className="relative z-10">
        <Header />
      </div>
    </div>
  );
}