import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div style={{display:'flex', height:'100vh', width:'100vw', overflow:'hidden', background:'#f8fafc'}}>
      <Sidebar />
      <div style={{flex:1, overflow:'auto', display:'flex', flexDirection:'column'}}>
        {children}
      </div>
    </div>
  )
}
