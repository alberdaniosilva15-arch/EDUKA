export default function ChatLayout({ children }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body, .tool-page, .chat-shell, .chat-main { 
          background-color: transparent !important; 
          background-image: none !important; 
          background: transparent !important; 
        }
      `}} />
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -10,
          backgroundColor: "#000",
          pointerEvents: "none"
        }}
        dangerouslySetInnerHTML={{
          __html: `
            <video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
              <source src="https://res.cloudinary.com/vgxylpmd/video/upload/v1784076748/kling_20260715_VIDEO_A_futurist_2203_0_pdw8mv.mp4" type="video/mp4" />
            </video>
          `
        }}
      />
      {children}
    </>
  );
}
