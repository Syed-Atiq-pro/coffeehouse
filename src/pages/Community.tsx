import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const seed = [
  { title:'Rain + Mocha = perfect.', author:'Coffee House', image:'/images/products/mocha.jpg', likes:128 },
  { title:'First coffee of the semester.', author:'Community', image:'/images/products/caffe-latte.jpg', likes:94 },
  { title:'The 7am ritual.', author:'Coffee House', image:'/images/products/americano.jpg', likes:76 },
]
export default function Community() {
  const { profile } = useAuth(); const [posts,setPosts]=useState(seed); const [text,setText]=useState(''); const [message,setMessage]=useState('')
  useEffect(()=>{ supabase.from('coffee_moments').select('id,title,image_url,likes,created_at').order('created_at',{ascending:false}).limit(18).then(({data})=>{ if(data?.length) setPosts(data.map((p:any)=>({title:p.title,author:'Coffee House member',image:p.image_url,likes:p.likes||0}))) }) },[])
  async function share(){ if(!profile || !text.trim()){setMessage('Sign in to share a coffee moment.');return} const {error}=await supabase.from('coffee_moments').insert({customer_id:profile.id,title:text.trim(),image_url:'/images/products/cappuccino.jpg'}); if(error){setMessage('Your database is ready for community moments once the table is enabled.');return} setText('');setMessage('Moment shared ✓') }
  return <main className="community-page"><nav><Link to="/" className="community-logo">COFFEE <i>HOUSE</i></Link><div><Link to="/barista">AI Barista</Link><Link to="/menu">Menu</Link><Link to="/dashboard">My House</Link></div></nav><header><span>THE COFFEE COMMUNITY</span><h1>Share the<br/><i>moment.</i></h1><p>Small rituals, favourite cups and the stories between them.</p></header><section className="moment-compose"><input value={text} onChange={e=>setText(e.target.value)} placeholder="What is in your cup today?"/><button onClick={share}>Share moment ↗</button>{message&&<small>{message}</small>}</section><section className="moments">{posts.map((p,i)=><article key={`${p.title}-${i}`}><div className="moment-image"><img src={p.image} alt=""/><span>0{i+1}</span></div><div><p>{p.author}</p><h2>{p.title}</h2><button onClick={()=>setPosts(posts.map((x,j)=>j===i?{...x,likes:x.likes+1}:x))}>♡ {p.likes}</button></div></article>)}</section></main>
}
