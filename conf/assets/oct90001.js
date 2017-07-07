{
    "meta": {
        "howto": ["oct10001", "oct10002"],
        "contacts": [],
        "links": [{
            "dest": "oct30014",
            "title": "What is tea",
            "window": true,
            "leftbar": true
        }, {
            "dest": "oct10001",
            "title": "how to prepare a cup of tea",
            "window": true,
            "leftbar": true
        }, {
            "dest": "oct10002",
            "title": "how to care",
            "window": true,
            "leftbar": true
        }],
        "title": "Customer wants to make a cup of tea",
        "id": "oct90001",
        "ocelot": 1,
        "lastAuthor": "6075844",
        "lastUpdate": 1493976883136,
        "version": 2,
        "filename": "oct90001.js"
    },
    "flow": {
        "1": {
            "type": "QuestionStanza",
            "text": 1,
            "answers": [2, 3],
            "next": ["2", "22"],
            "moreinfo": [0]
        },
        "2": {
            "type": "InstructionStanza",
            "text": 4,
            "next": ["3"]
        },
        "3": {
            "type": "QuestionStanza",
            "text": 5,
            "answers": [6, 7],
            "next": ["4", "19"]
        },
        "4": {
            "type": "InstructionStanza",
            "text": 8,
            "next": ["5"]
        },
        "5": {
            "type": "QuestionStanza",
            "text": 9,
            "answers": [10, 11],
            "next": ["6", "15"]
        },
        "6": {
            "type": "ImportantStanza",
            "text": 12,
            "next": ["7"]
        },
        "7": {
            "type": "ImportantStanza",
            "text": 13,
            "next": ["8"]
        },
        "8": {
            "type": "InstructionStanza",
            "text": 14,
            "next": ["9"],
            "link": 1
        },
        "9": {
            "type": "InstructionStanza",
            "text": 15,
            "next": ["10"]
        },
        "10": {
            "type": "QuestionStanza",
            "text": 16,
            "answers": [17, 18],
            "next": ["14", "11"]
        },
        "11": {
            "type": "NoteStanza",
            "text": 20,
            "next": ["12"]
        },
        "12": {
            "type": "InstructionStanza",
            "text": 21,
            "next": ["27"]
        },
        "13": {
            "type": "QuestionStanza",
            "text": 23,
            "answers": [24, 25],
            "next": ["28", "18"]
        },
        "14": {
            "type": "InstructionStanza",
            "text": 19,
            "next": ["end"],
            "link": 2
        },
        "15": {
            "type": "InstructionStanza",
            "text": 30,
            "next": ["16"]
        },
        "16": {
            "type": "InstructionStanza",
            "text": 31,
            "next": ["17"]
        },
        "17": {
            "type": "QuestionStanza",
            "text": 32,
            "answers": [33, 34],
            "next": ["6", "18"]
        },
        "18": {
            "type": "InstructionStanza",
            "text": 29,
            "next": ["end"]
        },
        "19": {
            "type": "InstructionStanza",
            "text": 35,
            "next": ["20"]
        },
        "20": {
            "type": "InstructionStanza",
            "text": 36,
            "next": ["21"]
        },
        "21": {
            "type": "QuestionStanza",
            "text": 37,
            "answers": [38, 39],
            "next": ["16", "18"]
        },
        "22": {
            "type": "InstructionStanza",
            "text": 40,
            "next": ["23"]
        },
        "23": {
            "type": "InstructionStanza",
            "text": 41,
            "next": ["24"]
        },
        "24": {
            "type": "QuestionStanza",
            "text": 42,
            "answers": [43, 44],
            "next": ["2", "18"]
        },
        "25": {
            "type": "QuestionStanza",
            "text": 16,
            "answers": [27, 28],
            "next": ["26", "18"]
        },
        "26": {
            "type": "ImportantStanza",
            "text": 13,
            "next": ["14"]
        },
        "27": {
            "type": "InstructionStanza",
            "text": 22,
            "next": ["13"]
        },
        "28": {
            "type": "InstructionStanza",
            "text": 26,
            "next": ["25"]
        },
        "start": {
            "type": "InstructionStanza",
            "text": 0,
            "next": ["1"]
        },
        "end": {
            "type": "EndStanza"
        }
    },
    "phrases": [
        ["Ask the customer if they have a tea bag", "Do you have a tea bag?"], "Do they have a tea bag?", "Yes - they do have a tea bag", "No - they do not have a tea bag", ["Ask the customer if they have a cup", "Do you have a cup?"], "Do they have a cup? ", "yes - they do have a cup ", "no - they don’t have a cup", ["Ask the customer if they have water to fill the kettle", "Do you have water to fill your kettle?"], "Do they have water to fill the kettle? ", "yes - they have water to fill the kettle", "no - they don’t have water to fill the kettle", "the kettle needs to be switched on at the mains ", "the boiled water will be very hot.", ["tell the customer how to prepare a cup of tea", "You need to prepare your cup of tea."],
        ["ask them if the water has boiled ", "Has water has boiled?"], "Has the water boiled?", "yes - the water has boiled ", "no - the water hasn’t boiled", ["Tell the customer how to make the cup of tea", "Now make your cup of tea"], "we can boil a pan of water if the kettle is broken ", ["Tell the customer the kettle is broken", "The kettle is broken."],
        ["ask the customer if they would like to boil the water using a pan", "Would you like to boil the water using a pan?"], "Would they like to boil the water using a pan?", "yes - they would like to boil the water using a pan", "no - they would not like to boil the water using a pan", ["Ask them if the water has boiled", "Has the water has boiled?"], "yes - the water has boiled", "no - the water has not boiled", ["Tell the customer they can’t make a cup of tea.", "You can’t make a cup of tea."],
        ["tell the customer they need to get water to fill the kettle ", "You need to get water to fill the kettle."],
        ["ask them if they have got water to fill the kettle ", "Have you got water to fill the kettle?"], "Have they got water to fill the kettle? ", "yes - they have got water to fill the kettle ", "no - they don’t have water to fill the kettle ", ["tell the customer they need to get a cup", "You need to get a cup."],
        ["ask them if they have got a cup", "Do you have a cup?"], "Have they got a cup?", "yes - they have got a cup ", "no - they have not got a cup ", ["tell the customer they need to get a tea bag ", "You need to get a tea bag."],
        ["ask them if they have got a tea bag ", "Have you got a tea bag?"], "Have they got a tea bag?", "yes - they have got a tea bag ", "no - they have not got a tea bag "
    ]
}