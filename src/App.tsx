// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { Book } from './types/book';

function App() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    axios
      .get('https://project-chat-server.onrender.com/api/books')
      // .get('http://localhost:5005/api/books')
      .then(res => {
        console.log(res.data);
        setBooks(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  return (
    <>
      <ul>
        {books.map(book => (
          <li key={book.id}>
            <strong>{book.title}</strong> by {book.authorName} ({book.year})
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
