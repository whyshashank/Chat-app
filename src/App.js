import React, { useEffect, useRef, useState } from 'react';
import Messages from './Components/Messages';
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { app } from './Firebase';
import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
} from '@chakra-ui/react';
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};

const logoutHandler = () => {
  signOut(auth);
};

function App() {
  const q = query(collection(db, 'Messages'), orderBy('createdAt', 'asc'));
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const divForScroll = useRef(null);

  console.log(user);
  const submitHandler = async e => {
    e.preventDefault();

    try {
      setMessage('');
      await addDoc(collection(db, 'Messages'), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });

      divForScroll.current.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      alert(error);
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, data => {
      setUser(data);
    });

    const unsubscribeit = onSnapshot(q, snap => {
      setMessages(
        snap.docs.map(item => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });

    return () => {
      unsubscribe();
      unsubscribeit();
    };
  }, []);

  return (
    <>
      <Box bgColor={'red.100'} color={'black'}>
        {user ? (
          <Container h={'100vh'} p={'4'} bgColor={'yellow.50'}>
            <VStack>
              <Button colorScheme={'green'} w={'full'} onClick={logoutHandler}>
                Logout
              </Button>

              <VStack h="600px" w={'full'} overflowY={'auto'} css={{"&::-webkit-scrollbar" : {display:"none"}}}>
                {messages.map((item) => (
                  <Messages
                    key={item.id}
                    user={item.uid === user.uid ? 'me' : 'other'}
                    text={item.text}
                    uri={item.uri}
                  />
                ))}
                <div ref={divForScroll}></div>
              </VStack>

              <form
                onSubmit={submitHandler}
                style={{ width: '100%' }}
                variant={'ghost'}
              >
                <HStack>
                  <Input
                    value={message}
                    placeholder="Enter Your Text..."
                    _placeholder={{ color: 'black' }}
                    color={'black'}
                    onChange={e => setMessage(e.target.value)}
                  />
                  <Button bgColor={'green'} type="submit">
                    Send
                  </Button>
                </HStack>
              </form>
            </VStack>
          </Container>
        ) : (
          <VStack h={'100vh'} justifyContent={'center'}>
            <Button onClick={loginHandler} colorScheme="purple">
              Login
            </Button>
          </VStack>
        )}
      </Box>
    </>
  );
}

export default App;
