import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import Create from './assets/create.jsx';
import App from './assets/canvas1.jsx';
import Tools from './assets/toolbox/toolbar.jsx';
import '../index.css'; 
import TestGemini from "./assets/test.jsx";

document.oncontextmenu = () => false;

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <div id="navbar">
      <Create/>
    </div>

    <body>
      <Tools/>
      <App/>     
    </body>

  </StrictMode>
)
