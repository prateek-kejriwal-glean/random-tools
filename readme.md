# Ai Apps Insights and names

## Description
Just a small script to get ai apps and its related insights to a csv.


## Installation and Usage
1. Open the project directory in terminal.
2. Install all the dependencies
    ```bash
    npm install .
    ```
2. Update the `config.js` with the actual values. It requires a glean auth token and your backend endpoint.
    ```js
    module.exports={
        gleanAuthToken: 'GLEAN_AUTH_TOKEN_RANDOM_GIBBERISH', // token you get from /createauthtoken api 
        gleanHost: 'instance-id' // your be endpoint 
    }
    ```
3. Run the script.
    ```bash
    node .
    ```
3. The extracted data will be exported to `data.csv` in `results` folder.

## Contact
For questions or feedback, contact [prateek.kejriwal@glean.com](mailto:prateek.kejriwal@glean.com).