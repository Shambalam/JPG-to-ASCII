public class Main {
    public static void main(String[] args) {
        System.out.println(romanToInt('III'));
    }
}


    public int romanToInt(String s) {
        int out = 0;
        int[] value = new int[s.length()];
        char[] r = s.toCharArray();
        String testing = "";
        
        for(int i = 0; i < r.length;i++)
        {
            switch(r[i])
            {
                case 'I':
                    value[i] = 1;
                    testing += "Case I\nval[i] = " +value[i] +"\n";
                case 'V':
                    value[i] = 5;
                    testing += "Case V\nval[i] = " +value[i] +"\n";
                case 'X':
                    value[i] = 10;
                    testing += "Case X\nval[i] = " +value[i] +"\n";
                case 'L':
                    value[i] = 50;
                    testing += "Case L\nval[i] = " +value[i] +"\n";
                case 'C':
                    value[i] = 100;
                    testing += "Case C\nval[i] = " +value[i] +"\n";
                case 'D':
                    value[i] = 500;
                    testing += "Case D\nval[i] = " +value[i] +"\n";
                case 'M':
                    value[i] = 1000;
                    testing += "Case M\nval[i] = " +value[i] +"\n";
            }
        }
        for(int i = 0; i < value.length - 1; i++)
        {
            if(value[i] < value[i+1])
                value[i] = value[i] * (-1);
            
            out += value[i];
        }
            
            
             return out;
    }
