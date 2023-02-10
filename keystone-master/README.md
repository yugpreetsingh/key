The administrative interface for the data crawling setup of 1DigitalStack

Following are the primary software components
* `pug` - the view / templating engine
* `express` - the web application server framework
* `express-session` and `session-file-store` - to store sessions
* `connect-flash` - to display error messages
* `multer` - to manage file uploads
* `mongoose` - to connect with MongoDB database
* `dotenv` - to manage the configuration through environment variables

# Providing the Configuration

The configuration is managed through the `dotenv` module which reads the `.env` file.

The file

```
.env.sample
```

in the project root has information on all required variables.

## Method 1

Provide the information as part of the command execution. It can be used when running it inside a Docker Container. The benefit is that you can spin up the instance just by using a Dockerfile with required variables, rather than copy pasting the `.env` file.

```
PORT=3000 \
    MONGODB_URI=mongodb://localhost:27017/keystone \
    
```

## Method 2

Copy the `.env.sample` file to `.env` in the root directory. Provide the relevant variables inside it. Suited for regular development environment.