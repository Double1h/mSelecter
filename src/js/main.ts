import mSelecter from './mSelecter';
import './mobileUtil.js';

var mySelecter = new mSelecter({
    el: '#mSelecterBtn',
    transition: true,
    relation: true,
    data: [
        {
            value: 'Olink1',
            child: [
                {
                    value: 'Tlink1',
                    child: [
                        { value: 'Thlink3' },
                        { value: 'Thlink4' },
                        { value: 'Thlink5' },
                        { value: 'Thlink6' }
                    ]
                },
                { value: 'Tlink2' },
                { value: 'Tlink3' },
                { value: 'Tlink4' },
                { value: 'Tlink5' }
            ]
        },
        {
            value: 'Olink2',
            child: [
                { value: 'Tlink6' },
                { value: 'Tlink7' },
                { value: 'Tlink8' },
                { value: 'Tlink9' },
                { value: 'Tlink10' }
            ]
        }
    ],
    defaultSelect: [0, 0],
    callback: function(data: any) {
        console.log(data);
    }
});

var mySelecter1 = new mSelecter({
    el: '#mSelecterBtn1',
    transition: true,
    relation: false,
    data: [
        [
            { id: 1, value: 'hahhahah1' },
            { id: 2, value: 'hahhahah2' },
            { id: 3, value: 'hahhahah3' },
            { id: 4, value: 'hahhahah4' },
            { id: 5, value: 'hahhahah5' },
            { id: 6, value: 'hahhahah6' }
        ],
        [
            { id: 1, value: 'hahhahah1' },
            { id: 2, value: 'hahhahah2' },
            { id: 3, value: 'hahhahah3' },
            { id: 4, value: 'hahhahah4' },
            { id: 5, value: 'hahhahah5' },
            { id: 6, value: 'hahhahah6' }
        ]
    ],
    defaultSelect: [0, 1],
    callback: function(data: any) {
        console.log(data);
    }
});
