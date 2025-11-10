import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import Create from './assets/create.jsx'
import InfiniteCanvas from './assets/canvas.jsx';
import Tools from './assets/toolbox/toolbar.jsx';

 document.oncontextmenu = function () {
            return false;
        }



createRoot(document.getElementById('root')).render(
  <StrictMode>
<div id="navbar">
  <Create/>
</div>
  <body>
    <Tools/>
    <InfiniteCanvas/>
  </body>
  </StrictMode>,
)
