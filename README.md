# Chat Messenger

Chat Messenger is a real-time messaging application designed for seamless and secure communication. It allows users to create chat rooms, send messages, and manage friends. The app is built with a focus on responsiveness and user experience, supporting both desktop and mobile devices.

## Features
- User authentication (login and signup)
- Real-time messaging with Socket.IO
- Chat room creation and management
- Friend management and invitations
- Responsive design for mobile and desktop
- Light and dark theme support

## Technologies
- **Frontend Framework**: React with TypeScript
- **State Management**: React Context API
- **Styling**: Mantine UI and custom CSS
- **Real-time Communication**: Socket.IO
- **Build Tool**: Vite
- **API Integration**: Axios for RESTful API calls

## Demo
Check out the live demo: [Chat Messenger](https://project-chat-client.onrender.com)

## Installation and Setup

Follow these steps to install and run the application locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/project-chat-client.git
   cd project-chat-client

2. **Install Dependencies**:
   Make sure you have Node.js installed. Then, run:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add the following variables:
   ```env
   VITE_API_URL=<your-backend-api-url>
   VITE_SOCKET_URL=<your-socket-server-url>
   ```

   Replace `<your-backend-api-url>` and `<your-socket-server-url>` with the appropriate URLs for your backend and Socket.IO server.

4. **Run the Application**:
   Start the development server:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   Open your browser and navigate to `http://localhost:5173`.

6. **Build for Production**:
   To create a production build, run:
   ```bash
   npm run build
   ```

   The build files will be available in the `dist` folder.