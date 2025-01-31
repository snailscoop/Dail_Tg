# Dail.Tg
A Telegram bot to find relevant content related to your needs.

This project is built using **Node.js**. Below are the instructions to run the project locally or using Docker.

## Prerequisites

- Node.js (version `12.x` or higher)
- npm (Node Package Manager)
- Docker (for containerized execution)

## Installation (Local Development)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/your-repository-name.git
   cd your-repository-name
Install dependencies:

Ensure that you have Node.js and npm installed. If you don't, download and install them from nodejs.org.

Run the following command to install the required dependencies:

bash
Copy
npm install
Configure the project:

You need to modify list.js, options.js, and snails.js based on your requirements. These files contain configuration settings that should be adjusted for your project to function correctly.

list.js: Update the lists of items, users, or whatever content this file is responsible for.
options.js: Update the options and settings that will configure the behavior of the application.
snails.js: Modify as needed for snail-related functionality or other custom configurations.
Create a .env file:

Copy the .env.example file to .env:

bash
Copy
cp .env.example .env
Open the .env file and set any required environment variables, such as tokens or database credentials.

Specifically, ensure you add the TELEGRAM_BOT_TOKEN (you can get it by creating a bot on Telegram using the BotFather).
Run the application locally:

To run the project locally, use the following command:

bash
Copy
node index.js
This will start the application on your local machine.

Running the Project with Docker
If you'd prefer to run the project in a Docker container, follow the steps below.

Build the Docker image (without passing the token at build time):

First, build the Docker image:

bash
Copy
docker build -t your-image-name .
Run the Docker container (pass the token at runtime):

After the image is built, run the container using:

bash
Copy
docker run -d -e TOKEN=your-telegram-token your-image-name
The container will now run in detached mode (-d), and the environment variable TELEGRAM_BOT_TOKEN will be passed to the container.
